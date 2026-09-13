using UbuntuConnectAPI.Validation;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class ValidationPatternsTests
{
    [Theory]
    [InlineData("user@example.com", true)]
    [InlineData("a.b-c@sub.domain.co.za", true)]
    [InlineData("no-at-sign.com", false)]
    [InlineData("spaces in@email.com", false)]
    [InlineData("@nolocal.com", false)]
    [InlineData("noTld@domain", false)]
    [InlineData("", false)]
    public void IsValidEmail_works(string value, bool expected)
        => Assert.Equal(expected, ValidationPatterns.IsValidEmail(value));

    [Theory]
    [InlineData("password1", true)]
    [InlineData("Abcdef12", true)]
    [InlineData("short1", false)]      // < 8
    [InlineData("alllettersonly", false)] // no digit
    [InlineData("12345678", false)]    // no letter
    [InlineData("", false)]
    public void IsStrongPassword_works(string value, bool expected)
        => Assert.Equal(expected, ValidationPatterns.IsStrongPassword(value));

    [Theory]
    [InlineData("+27821234567", true)]
    [InlineData("0821234567", true)]
    [InlineData("+27 82 123 4567", true)]  // spaces stripped
    [InlineData("082-123-4567", true)]     // dashes stripped
    [InlineData("082123456", false)]       // too short
    [InlineData("+27021234567", false)]    // leading 0 after +27 invalid
    [InlineData("1234567890", false)]      // no valid prefix
    [InlineData("", false)]
    public void IsValidPhone_works(string value, bool expected)
        => Assert.Equal(expected, ValidationPatterns.IsValidPhone(value));

    [Theory]
    [InlineData("2024/029687/07", true)]
    [InlineData("2026/123456/07", true)]
    [InlineData("24/029687/07", false)]    // 2-digit year
    [InlineData("2024/29687/07", false)]   // 5-digit sequence
    [InlineData("2024-029687-07", false)]  // wrong separators
    [InlineData("", false)]
    public void IsValidCipcNumber_works(string value, bool expected)
        => Assert.Equal(expected, ValidationPatterns.IsValidCipcNumber(value));

    [Theory]
    [InlineData("123-456", true)]
    [InlineData("123-456-NPO", true)]
    [InlineData("NPO 123-456", true)]
    [InlineData("npo123-456", true)]
    [InlineData("12-456", false)]      // wrong digit grouping
    [InlineData("123456", false)]      // missing dash
    [InlineData("", false)]
    public void IsValidNpoRegNum_works(string value, bool expected)
        => Assert.Equal(expected, ValidationPatterns.IsValidNpoRegNum(value));

    [Fact]
    public void Attributes_allow_null_but_reject_bad_values()
    {
        Assert.True(new PhoneNumberAttribute().IsValid(null));
        Assert.True(new PhoneNumberAttribute().IsValid("+27821234567"));
        Assert.False(new PhoneNumberAttribute().IsValid("nope"));

        Assert.True(new CipcNumberAttribute().IsValid(null));
        Assert.False(new CipcNumberAttribute().IsValid("bad"));

        Assert.True(new NpoRegistrationNumberAttribute().IsValid(null));
        Assert.False(new NpoRegistrationNumberAttribute().IsValid("bad"));

        Assert.True(new StrongPasswordAttribute().IsValid(null));
        Assert.False(new StrongPasswordAttribute().IsValid("weak"));
        Assert.True(new StrongPasswordAttribute().IsValid("password1"));
    }
}
