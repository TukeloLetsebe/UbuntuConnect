using System.ComponentModel.DataAnnotations;

namespace UbuntuConnectAPI.Validation;

/// <summary>Validates a South African phone number (E.164 +27… or local 0…). Nulls pass — combine with [Required] to make mandatory.</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class PhoneNumberAttribute : ValidationAttribute
{
    public PhoneNumberAttribute()
        : base("Enter a valid South African phone number, e.g. +27821234567 or 0821234567.") { }

    public override bool IsValid(object? value)
    {
        if (value is null) return true;
        return value is string s && ValidationPatterns.IsValidPhone(s);
    }
}

/// <summary>Validates a CIPC company registration number in the format YYYY/NNNNNN/NN.</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class CipcNumberAttribute : ValidationAttribute
{
    public CipcNumberAttribute()
        : base("Enter a valid company registration number in the format YYYY/NNNNNN/NN, e.g. 2026/123456/07.") { }

    public override bool IsValid(object? value)
    {
        if (value is null) return true;
        return value is string s && ValidationPatterns.IsValidCipcNumber(s);
    }
}

/// <summary>Validates a South African NPO registration number (e.g. 123-456 or 123-456-NPO).</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class NpoRegistrationNumberAttribute : ValidationAttribute
{
    public NpoRegistrationNumberAttribute()
        : base("Enter a valid NPO registration number, e.g. 123-456 or 123-456-NPO.") { }

    public override bool IsValid(object? value)
    {
        if (value is null) return true;
        return value is string s && ValidationPatterns.IsValidNpoRegNum(s);
    }
}

/// <summary>Validates password strength (min 8 chars, at least one letter and one digit).</summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter)]
public sealed class StrongPasswordAttribute : ValidationAttribute
{
    public StrongPasswordAttribute()
        : base("Password must be at least 8 characters and include a letter and a number.") { }

    public override bool IsValid(object? value)
    {
        if (value is null) return true;
        return value is string s && ValidationPatterns.IsStrongPassword(s);
    }
}
