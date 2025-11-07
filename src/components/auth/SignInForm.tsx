import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      await login({ email, password });
      // Redirect to the page they were trying to access, or dashboard
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.errors) {
        // Handle Laravel validation errors
        const errors: Record<string, string> = {};
        Object.keys(error.errors).forEach(key => {
          errors[key] = error.errors[key][0]; // Take the first error message
        });
        setFieldErrors(errors);
        
        // Set general error message based on the specific error
        if (errors.email) {
          if (errors.email.includes('No account found')) {
            setError("No account found with this email address. Please check your email or contact an administrator.");
          } else if (errors.email.includes('deactivated')) {
            setError("Your account has been deactivated. Please contact an administrator.");
          } else {
            setError("Please check your email address.");
          }
        } else if (errors.password) {
          if (errors.password.includes('incorrect')) {
            setError("The password you entered is incorrect. Please try again.");
          } else {
            setError("Please check your password.");
          }
        } else {
          setError("Please check your input and try again.");
        }
      } else if (error.message) {
        // Handle general error messages
        setError(error.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return fieldErrors[fieldName] || "";
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@gmail.com"
                    className={getFieldError('email') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  />
                  {getFieldError('email') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {getFieldError('email')}
                    </p>
                  )}
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={getFieldError('password') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {getFieldError('password') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {getFieldError('password')}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
