import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useAuth, type RegisterDto } from "../../context/AuthContext";
import { AxiosError } from "axios";

type UserTypeSelection = "npo" | "individual" | "business" | "admin" | null;

export default function Register() {
  const { register } = useAuth();
  const [selectedType, setSelectedType] = useState<UserTypeSelection>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      let dto: RegisterDto;

      const baseFields = {
        userEmail: formData.get("email") as string,
        password: formData.get("password") as string,
        userContact: (formData.get("phone") as string) || undefined,
        location: (formData.get("location") as string) || undefined,
      };

      switch (selectedType) {
        case "individual":
          dto = {
            ...baseFields,
            userType: "Individual",
            firstName: formData.get("first-name") as string,
            lastName: formData.get("last-name") as string,
            causeOfCare: (formData.get("interests") as string) || undefined,
          };
          break;
        case "npo":
          dto = {
            ...baseFields,
            userType: "NPO",
            npoRegNum: formData.get("registration-number") as string,
            organizationName: formData.get("org-name") as string,
            npoFocusArea: (formData.get("focus-area") as string) || undefined,
            npoMission: (formData.get("mission") as string) || undefined,
          };
          break;
        case "business":
          dto = {
            ...baseFields,
            userType: "Business",
            businessRegNum: formData.get("registration-number") as string,
            industry: (formData.get("industry") as string) || undefined,
            contactPersonName: (formData.get("contact-name") as string) || undefined,
            contactPersonTitle: (formData.get("job-title") as string) || undefined,
            businessEmail: baseFields.userEmail,
            csrGoal: (formData.get("csr-goals") as string) || undefined,
          };
          break;
        case "admin":
          dto = {
            ...baseFields,
            userType: "Admin",
          };
          break;
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
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
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
                    onClick={() => setSelectedType("npo")}
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
                    onClick={() => setSelectedType("individual")}
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
                    onClick={() => setSelectedType("business")}
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

                  <button
                    onClick={() => setSelectedType("admin")}
                    className="p-6 border-2 border-neutral-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                        <span className="text-2xl" aria-hidden="true">🔐</span>
                      </div>
                      <div>
                        <h3 className="mb-1">Administrator</h3>
                        <p className="text-neutral-600 text-sm">
                          Manage platform, verify NPOs, and oversee operations
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
                    onClick={() => { setSelectedType(null); setError(null); }}
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
                    <Input id="registration-number" name="registration-number" placeholder="e.g., 123-456-NPO" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="contact@yourorg.org" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+27 XX XXX XXXX" className="mt-2" disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="City, Province" className="mt-2" disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="focus-area">Focus Area</Label>
                    <Input id="focus-area" name="focus-area" placeholder="e.g., Education, Health, Youth Development" className="mt-2" disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="mission">Mission Statement</Label>
                    <Textarea id="mission" name="mission" placeholder="Briefly describe your organization's mission" className="mt-2" rows={4} disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Create a secure password (min 8 characters)" className="mt-2" required minLength={8} disabled={loading} />
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
                    onClick={() => { setSelectedType(null); setError(null); }}
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
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input id="location" name="location" placeholder="City, Province" className="mt-2" disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="interests">Causes You Care About (Optional)</Label>
                    <Input id="interests" name="interests" placeholder="e.g., Education, Environment, Health" className="mt-2" disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Create a secure password (min 8 characters)" className="mt-2" required minLength={8} disabled={loading} />
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
                    onClick={() => { setSelectedType(null); setError(null); }}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="registration-number">Company Registration Number</Label>
                    <Input id="registration-number" name="registration-number" placeholder="Registration number" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" name="industry" placeholder="e.g., Technology, Finance, Retail" className="mt-2" disabled={loading} />
                  </div>

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
                    <Input id="phone" name="phone" type="tel" placeholder="+27 XX XXX XXXX" className="mt-2" disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="csr-goals">CSR/B-BBEE Goals (Optional)</Label>
                    <Textarea id="csr-goals" name="csr-goals" placeholder="Describe your social impact objectives" className="mt-2" rows={4} disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Create a secure password (min 8 characters)" className="mt-2" required minLength={8} disabled={loading} />
                  </div>

                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
                    {loading ? "Creating account..." : "Create Business Account"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Admin Registration Form */}
            {selectedType === "admin" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-lg p-8 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2>Administrator Registration</h2>
                  <button
                    onClick={() => { setSelectedType(null); setError(null); }}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" placeholder="admin@ubuntuconnect.org" className="mt-2" required disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+27 XX XXX XXXX" className="mt-2" disabled={loading} />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" placeholder="Create a secure password (min 8 characters)" className="mt-2" required minLength={8} disabled={loading} />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                    {loading ? "Creating account..." : "Create Administrator Account"}
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
