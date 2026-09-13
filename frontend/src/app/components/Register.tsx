import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useAuth, type RegisterDto } from "../../context/AuthContext";
import {
  isStrongPassword,
  isValidEmail,
  isValidPhone,
  isValidNpoRegNum,
  isValidCipcNumber,
  validationMessages,
} from "../../lib/validators";
import {
  NPO_FOCUS_AREAS,
  BUSINESS_INDUSTRIES,
  CSR_BBEE_GOALS,
} from "../../lib/registrationOptions";
import SelectWithOther, { resolveWithOther } from "./registration/SelectWithOther";
import LocationPicker, { composeLocation } from "./registration/LocationPicker";
import CausesMultiSelect from "./registration/CausesMultiSelect";
import { AxiosError } from "axios";

type UserTypeSelection = "npo" | "individual" | "business" | null;

export default function Register() {
  const { register } = useAuth();
  const [selectedType, setSelectedType] = useState<UserTypeSelection>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Controlled structured fields (dropdowns / multi-select / location) ──
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [focusAreaOther, setFocusAreaOther] = useState("");
  const [industry, setIndustry] = useState("");
  const [industryOther, setIndustryOther] = useState("");
  const [csrGoal, setCsrGoal] = useState("");
  const [csrGoalOther, setCsrGoalOther] = useState("");
  const [causes, setCauses] = useState<string[]>([]);

  const resetStructured = () => {
    setProvince(""); setCity("");
    setFocusArea(""); setFocusAreaOther("");
    setIndustry(""); setIndustryOther("");
    setCsrGoal(""); setCsrGoalOther("");
    setCauses([]);
  };

  const changeType = (type: UserTypeSelection) => {
    setSelectedType(type);
    setError(null);
    resetStructured();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Client-side gate: email format, password strength, and password match.
    const emailValue = formData.get("email") as string;
    const passwordValue = formData.get("password") as string;
    const confirmValue = formData.get("confirm-password") as string;
    const phoneValue = (formData.get("phone") as string) || "";

    if (!isValidEmail(emailValue)) {
      setError(validationMessages.email);
      setLoading(false);
      return;
    }
    if (!isStrongPassword(passwordValue)) {
      setError(validationMessages.password);
      setLoading(false);
      return;
    }
    if (passwordValue !== confirmValue) {
      setError("Passwords do not match. Please re-enter your password.");
      setLoading(false);
      return;
    }
    // Phone is optional, but if provided it must be valid.
    if (phoneValue && !isValidPhone(phoneValue)) {
      setError(validationMessages.phone);
      setLoading(false);
      return;
    }

    const location = composeLocation(province, city);

    try {
      let dto: RegisterDto;

      const baseFields = {
        userEmail: emailValue,
        password: passwordValue,
        userContact: phoneValue || undefined,
        location,
      };

      switch (selectedType) {
        case "individual":
          dto = {
            ...baseFields,
            userType: "Individual",
            firstName: formData.get("first-name") as string,
            lastName: formData.get("last-name") as string,
            causeOfCare: causes.length > 0 ? causes.join(", ") : undefined,
          };
          break;
        case "npo": {
          const regNum = formData.get("registration-number") as string;
          if (!isValidNpoRegNum(regNum)) {
            setError(validationMessages.npoRegNum);
            setLoading(false);
            return;
          }
          dto = {
            ...baseFields,
            userType: "NPO",
            npoRegNum: regNum,
            organizationName: formData.get("org-name") as string,
            npoFocusArea: resolveWithOther(focusArea, focusAreaOther),
            npoMission: (formData.get("mission") as string) || undefined,
          };
          break;
        }
        case "business": {
          const regNum = formData.get("registration-number") as string;
          if (!isValidCipcNumber(regNum)) {
            setError(validationMessages.cipc);
            setLoading(false);
            return;
          }
          dto = {
            ...baseFields,
            userType: "Business",
            businessRegNum: regNum,
            industry: resolveWithOther(industry, industryOther),
            contactPersonName: (formData.get("contact-name") as string) || undefined,
            contactPersonTitle: (formData.get("job-title") as string) || undefined,
            businessEmail: baseFields.userEmail,
            csrGoal: resolveWithOther(csrGoal, csrGoalOther),
          };
          break;
        }
        default:
          setError("Please select an account type.");
          setLoading(false);
          return;
      }

      await register(dto);
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response) {
          const message =
            typeof err.response.data === "string"
              ? err.response.data
              : err.response.data?.message || err.response.data?.title;
          setError(message || "Registration failed. Please try again.");
        } else if (err.request) {
          setError("Unable to connect to server. Please check your connection.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 sticky top-0 z-40">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="text-xl text-neutral-900">
            UbuntuConnect
          </Link>
          <Link to="/" className="text-neutral-600 hover:text-neutral-900">
            Back to Home
          </Link>
        </div>
      </header>

      <div className="py-12 px-6 lg:px-12">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-center mb-3">Create Your Account</h1>
            <p className="text-center text-neutral-600 mb-12">
              Join the community and start making an impact
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* User Type Selection */}
            {!selectedType && (
              <div className="bg-white rounded-lg p-8 shadow-sm">
                <h2 className="mb-6 text-center">I am a...</h2>
                <div className="grid gap-4">
                  <button
                    onClick={() => changeType("npo")}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <span className="text-2xl" aria-hidden="true">🏘️</span>
                      </div>
                      <div>
                        <h3 className="mb-1">Non-Profit Organization</h3>
                        <p className="text-neutral-600 text-sm">
                          Showcase your work, build credibility, and connect with supporters
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => changeType("individual")}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <span className="text-2xl" aria-hidden="true">👤</span>
                      </div>
                      <div>
                        <h3 className="mb-1">Individual</h3>
                        <p className="text-neutral-600 text-sm">
                          Discover causes, follow organizations, and donate with confidence
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => changeType("business")}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                        <span className="text-2xl" aria-hidden="true">🏢</span>
                      </div>
                      <div>
                        <h3 className="mb-1">Business</h3>
                        <p className="text-neutral-600 text-sm">
                          Find NPO partners for B-BBEE and CSR initiatives
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* NPO Registration Form */}
            {selectedType === "npo" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2>NPO Registration</h2>
                  <button
                    onClick={() => changeType(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input id="org-name" name="org-name" placeholder="Your NPO name" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="registration-number">NPO Registration Number</Label>
                    <Input id="registration-number" name="registration-number" placeholder="e.g., 123-456 or 123-456-NPO" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="contact@yourorg.org" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+27821234567 or 0821234567" className="mt-2" disabled={loading} />
                  </div>

                  <LocationPicker
                    province={province}
                    city={city}
                    onProvinceChange={setProvince}
                    onCityChange={setCity}
                    disabled={loading}
                  />

                  <SelectWithOther
                    id="focus-area"
                    label="Focus Area"
                    options={NPO_FOCUS_AREAS}
                    value={focusArea}
                    onChange={setFocusArea}
                    otherValue={focusAreaOther}
                    onOtherChange={setFocusAreaOther}
                    placeholder="Select your focus area"
                    otherPlaceholder="Describe your focus area"
                    disabled={loading}
                  />

                  <div>
                    <Label htmlFor="mission">Mission Statement</Label>
                    <Textarea id="mission" name="mission" placeholder="Briefly describe your organization's mission" className="mt-2" rows={4} disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Create a secure password (min 8 characters, letters + numbers)" className="mt-2" required minLength={8} disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Re-enter Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" placeholder="Re-enter your password to confirm" className="mt-2" required minLength={8} disabled={loading} />
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    {loading ? "Creating account..." : "Create NPO Account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Individual Registration Form */}
            {selectedType === "individual" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2>Individual Registration</h2>
                  <button
                    onClick={() => changeType(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" name="first-name" placeholder="First name" className="mt-2" required disabled={loading} />
                    </div>
                    <div>
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" name="last-name" placeholder="Last name" className="mt-2" required disabled={loading} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="you@example.com" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+27821234567 or 0821234567" className="mt-2" disabled={loading} />
                  </div>

                  <LocationPicker
                    province={province}
                    city={city}
                    onProvinceChange={setProvince}
                    onCityChange={setCity}
                    disabled={loading}
                  />

                  <CausesMultiSelect selected={causes} onChange={setCauses} disabled={loading} />

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Create a secure password (min 8 characters, letters + numbers)" className="mt-2" required minLength={8} disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Re-enter Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" placeholder="Re-enter your password to confirm" className="mt-2" required minLength={8} disabled={loading} />
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Business Registration Form */}
            {selectedType === "business" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2>Business Registration</h2>
                  <button
                    onClick={() => changeType(null)}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="registration-number">Company Registration Number</Label>
                    <Input id="registration-number" name="registration-number" placeholder="e.g., 2026/123456/07" className="mt-2" required disabled={loading} />
                  </div>

                  <SelectWithOther
                    id="industry"
                    label="Industry"
                    options={BUSINESS_INDUSTRIES}
                    value={industry}
                    onChange={setIndustry}
                    otherValue={industryOther}
                    onOtherChange={setIndustryOther}
                    placeholder="Select your industry"
                    otherPlaceholder="Describe your industry"
                    disabled={loading}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contact-name">Contact Person</Label>
                      <Input id="contact-name" name="contact-name" placeholder="Full name" className="mt-2" disabled={loading} />
                    </div>
                    <div>
                      <Label htmlFor="job-title">Job Title</Label>
                      <Input id="job-title" name="job-title" placeholder="Position" className="mt-2" disabled={loading} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="contact@company.com" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+27821234567 or 0821234567" className="mt-2" disabled={loading} />
                  </div>

                  <LocationPicker
                    province={province}
                    city={city}
                    onProvinceChange={setProvince}
                    onCityChange={setCity}
                    disabled={loading}
                  />

                  <SelectWithOther
                    id="csr-goals"
                    label="CSR / B-BBEE Goals (Optional)"
                    options={CSR_BBEE_GOALS}
                    value={csrGoal}
                    onChange={setCsrGoal}
                    otherValue={csrGoalOther}
                    onOtherChange={setCsrGoalOther}
                    placeholder="Select a goal"
                    otherPlaceholder="Describe your goal"
                    disabled={loading}
                  />

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Create a secure password (min 8 characters, letters + numbers)" className="mt-2" required minLength={8} disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Re-enter Password</Label>
                    <Input id="confirm-password" name="confirm-password" type="password" placeholder="Re-enter your password to confirm" className="mt-2" required minLength={8} disabled={loading} />
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    {loading ? "Creating account..." : "Create Business Account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Sign In Link */}
            {selectedType && (
              <p className="text-center text-neutral-600 mt-6">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-600 hover:text-orange-700">
                  Sign in
                </Link>
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
