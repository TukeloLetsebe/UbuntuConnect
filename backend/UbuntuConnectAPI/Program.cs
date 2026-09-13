
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Email;
using UbuntuConnectAPI.Services.Storage;
using UbuntuConnectAPI.Services.Notifications;
using UbuntuConnectAPI.Services.Admin;
using UbuntuConnectAPI.Services.Cleanup;
using UbuntuConnectAPI.Services.Fundraisers;
using UbuntuConnectAPI.Services.Payments;
using UbuntuConnectAPI.Services.Verification;
using UbuntuConnectAPI.Services.FaceVerification;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi;



var builder = WebApplication.CreateBuilder(args);


// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Email infrastructure (Task 1) ──────────────────────────
// Provider is selected by config ("Email:Provider"). Mock logs the message
// and keeps an in-memory outbox; a real SMTP provider can be dropped in later
// without touching any caller.
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));
var emailProvider = builder.Configuration[$"{EmailOptions.SectionName}:Provider"] ?? "Mock";
if (string.Equals(emailProvider, "Mock", StringComparison.OrdinalIgnoreCase))
    builder.Services.AddScoped<IEmailService, MockEmailService>();
else
    builder.Services.AddScoped<IEmailService, MockEmailService>(); // TODO: real SMTP provider
builder.Services.AddScoped<IEmailVerificationTokenService, EmailVerificationTokenService>();

// ── File storage infrastructure (Task 2) ───────────────────
// Local disk provider now; an Azure Blob provider can replace it later behind
// the same IFileStorageService interface. Images are resized/compressed on save.
builder.Services.Configure<FileStorageOptions>(builder.Configuration.GetSection(FileStorageOptions.SectionName));
builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();

// ── Notification infrastructure (Task 3) ───────────────────
// Feature code calls INotificationService to create in-app notifications;
// users read them via NotificationController (bell + unread badge).
builder.Services.AddScoped<INotificationService, NotificationService>();

// ── Verification gate (Task 12) ────────────────────────────
// Anti-fraud/AML: blocks donate/topup/volunteer-apply unless the user is
// email-verified AND identity-verified.
builder.Services.AddScoped<IVerificationGate, VerificationGate>();

// ── Face verification (Task 13 seam + Task 15 engine) ──────
// When "FaceVerification:Enabled" is true, use the local FaceONNX engine
// (singleton — models loaded once). Otherwise the no-op service, so the
// self-service face-scan route falls back to admin review.
builder.Services.Configure<FaceVerificationOptions>(builder.Configuration.GetSection(FaceVerificationOptions.SectionName));
var faceEnabled = builder.Configuration.GetValue<bool>($"{FaceVerificationOptions.SectionName}:Enabled");
if (faceEnabled)
    builder.Services.AddSingleton<IFaceVerificationService, FaceOnnxVerificationService>();
else
    builder.Services.AddScoped<IFaceVerificationService, NoOpFaceVerificationService>();

// ── Payments & wallet limits (Task 19) ─────────────────────
// Simulated card gateway (Luhn + expiry validation, always approves valid
// cards) + server-side wallet top-up/withdrawal limits.
builder.Services.Configure<WalletLimitsOptions>(builder.Configuration.GetSection(WalletLimitsOptions.SectionName));
builder.Services.AddSingleton<IPaymentSimulationService, PaymentSimulationService>();

// ── Admin seeding (Task 7) ─────────────────────────────────
// Admins are NEVER self-registerable. A single admin is seeded at startup
// from the "AdminSeed" config section when enabled (idempotent).
builder.Services.Configure<AdminSeedOptions>(builder.Configuration.GetSection(AdminSeedOptions.SectionName));
builder.Services.AddHostedService<AdminSeeder>();

// ── Ghost account cleanup (Task 8) ─────────────────────────
// Periodic background job removes never-verified "ghost" accounts (soft then
// hard delete). Admins can also preview/run it on demand via AdminController.
builder.Services.Configure<GhostCleanupOptions>(builder.Configuration.GetSection(GhostCleanupOptions.SectionName));
builder.Services.AddScoped<IGhostAccountCleanupService, GhostAccountCleanupService>();
builder.Services.AddHostedService<GhostCleanupBackgroundService>();

// ── Fundraiser auto-close (Task 18) ────────────────────────
// Periodic background job marks Active fundraisers Completed once their EndDate
// has passed or their RaisedAmount reaches the TargetAmount, then notifies the NPO.
builder.Services.Configure<FundraiserAutoCloseOptions>(builder.Configuration.GetSection(FundraiserAutoCloseOptions.SectionName));
builder.Services.AddScoped<IFundraiserAutoCloseService, FundraiserAutoCloseService>();
builder.Services.AddHostedService<FundraiserAutoCloseBackgroundService>();

//registers JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});
builder.Services.AddAuthorization();
//END OF JWT AUTH

// CORS — allow the React dev server origin only (not AllowAnyOrigin)
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
//builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token like this: Bearer {your token}"
    });
    options.OperationFilter<UbuntuConnectAPI.Filters.SwaggerAuthOperationFilter>();

});


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    //app.MapOpenApi();
    app.UseSwagger();

    // Explicitly routes the Swagger UI to read from the .NET 10 OpenAPI endpoint
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "UbuntuConnectAPI v1");
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors("FrontendDev");

// ── Serve uploaded files (Task 2) ──────────────────────────
// Maps the physical uploads folder to the configured public URL prefix so
// stored images/documents are reachable by their returned URL.
var storageOptions = app.Configuration.GetSection(FileStorageOptions.SectionName).Get<FileStorageOptions>()
    ?? new FileStorageOptions();
var uploadsPhysicalPath = Path.Combine(app.Environment.ContentRootPath, storageOptions.LocalRootFolder);
Directory.CreateDirectory(uploadsPhysicalPath);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPhysicalPath),
    RequestPath = storageOptions.PublicPathPrefix
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();