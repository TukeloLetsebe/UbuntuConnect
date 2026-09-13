using System.Text.RegularExpressions;

namespace UbuntuConnectAPI.Validation;

/// <summary>
/// Central, reusable format validators shared by DTO attributes and any
/// service that needs to check a value. Keeping the rules here means the
/// backend has a single source of truth for what a valid phone / registration
/// number looks like (the frontend mirrors these in validators.ts).
/// </summary>
public static partial class ValidationPatterns
{
    // Basic, pragmatic email shape (full RFC validation is not the goal).
    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailRegex();

    // South African phone numbers:
    //   E.164:  +27 followed by 9 digits (leading digit 1-9), e.g. +27821234567
    //   Local:  0 followed by 9 digits, e.g. 0821234567
    // Spaces, dashes and parentheses are stripped before matching.
    [GeneratedRegex(@"^(\+27[1-9]\d{8}|0[1-9]\d{8})$")]
    private static partial Regex PhoneRegex();

    // CIPC company registration number: YYYY/NNNNNN/NN (e.g. 2024/029687/07).
    // Year 1900-2099 to stay realistic.
    [GeneratedRegex(@"^(19|20)\d{2}/\d{6}/\d{2}$")]
    private static partial Regex CipcRegex();

    // SA NPO number: core NNN-NNN with an optional "NPO" label at either end.
    // Accepts: "123-456", "123-456-NPO", "NPO 123-456", "NPO123-456".
    [GeneratedRegex(@"^(NPO[\s-]?)?\d{3}-\d{3}([\s-]?NPO)?$", RegexOptions.IgnoreCase)]
    private static partial Regex NpoRegNumRegex();

    public static bool IsValidEmail(string? value)
        => !string.IsNullOrWhiteSpace(value) && EmailRegex().IsMatch(value.Trim());

    /// <summary>Password must be at least 8 chars and contain a letter and a digit.</summary>
    public static bool IsStrongPassword(string? value)
    {
        if (string.IsNullOrEmpty(value) || value.Length < 8)
            return false;
        bool hasLetter = value.Any(char.IsLetter);
        bool hasDigit = value.Any(char.IsDigit);
        return hasLetter && hasDigit;
    }

    public static bool IsValidPhone(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;
        var normalized = NormalizePhone(value);
        return PhoneRegex().IsMatch(normalized);
    }

    /// <summary>Removes spaces, dashes and parentheses for lenient input.</summary>
    public static string NormalizePhone(string value)
        => Regex.Replace(value.Trim(), @"[\s\-()]", "");

    public static bool IsValidCipcNumber(string? value)
        => !string.IsNullOrWhiteSpace(value) && CipcRegex().IsMatch(value.Trim());

    public static bool IsValidNpoRegNum(string? value)
        => !string.IsNullOrWhiteSpace(value) && NpoRegNumRegex().IsMatch(value.Trim());
}
