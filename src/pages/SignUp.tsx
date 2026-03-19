import { useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowLeft, ArrowRight, Merge } from "lucide-react";
import {
  TextureCardStyled,
  TextureCardHeader,
  TextureCardTitle,
  TextureCardContent,
  TextureCardFooter,
  TextureSeparator,
} from "../components/TextureCard";
import { TextureButton } from "../components/TextureButton";
import { account } from "../lib/appwrite/client";
import { ID, OAuthProvider } from "appwrite";
import { useUser } from "../hooks/useUser";
import { AlertCircle } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const { checkSession } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      await checkSession();
      // PublicRoute will instantly push to /dashboard
    } catch (err: any) {
      setError(err.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    account.createOAuth2Session(
      OAuthProvider.Google, 
      `${window.location.origin}/dashboard`, 
      `${window.location.origin}/signup`
    );
  };

  return (
    <div className="min-h-screen bg-blueprint flex items-center justify-center p-6 grid-bg noise-bg relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-accent/5 blur-[120px] rounded-full" />
      </div>

      <Link 
        to="/" 
        className="absolute top-8 left-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-paper/40 hover:text-emerald-accent transition-all z-10"
      >
        <ArrowLeft size={14} /> Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <TextureCardStyled className="border-paper/5 bg-blueprint/60 backdrop-blur-2xl">
          <TextureCardHeader className="flex flex-col gap-1 items-center justify-center p-8">
            <div className="p-4 bg-blueprint border border-emerald-accent/20 rounded-full mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Merge className="h-8 w-8 text-emerald-accent" />
            </div>
            <TextureCardTitle className="text-3xl">Create Account</TextureCardTitle>
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-paper/40 mt-2">
              Join the next generation of system architects
            </p>
          </TextureCardHeader>
          
          <TextureSeparator className="bg-paper/5" />
          
          <TextureCardContent className="p-8 pt-0">
            <div className="flex justify-center gap-3 mb-6">
              <TextureButton variant="icon" className="flex-1 h-12" onClick={handleGoogleAuth} type="button">
                <svg width="20" height="20" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                  <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/>
                  <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/>
                  <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/>
                  <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/>
                </svg>
                <span className="ml-2">Google</span>
              </TextureButton>
              <TextureButton variant="icon" className="flex-1 h-12" onClick={() => navigate("/dashboard")}>
                <svg viewBox="0 0 256 250" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                  <path d="M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46 6.397 1.185 8.746-2.777 8.746-6.158 0-3.052-.12-13.135-.174-23.83-35.61 7.742-43.124-15.103-43.124-15.103-5.823-14.795-14.213-18.73-14.213-18.73-11.613-7.944.876-7.78.876-7.78 12.853.902 19.621 13.19 19.621 13.19 11.417 19.568 29.945 13.911 37.249 10.64 1.149-8.272 4.466-13.92 8.127-17.116-28.431-3.236-58.318-14.212-58.318-63.258 0-13.975 5-25.394 13.188-34.358-1.329-3.224-5.71-16.242 1.24-33.874 0 0 10.749-3.44 35.21 13.121 10.21-2.836 21.16-4.258 32.038-4.307 10.878.049 21.837 1.47 32.066 4.307 24.431-16.56 35.165-13.12 35.165-13.12 6.967 17.63 2.584 30.65 1.255 33.873 8.207 8.964 13.173 20.383 13.173 34.358 0 49.163-29.944 59.988-58.447 63.157 4.591 3.972 8.682 11.762 8.682 23.704 0 17.126-.148 30.91-.148 35.126 0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002 256 57.307 198.691 0 128.001 0Z"/>
                </svg>
                <span className="ml-2">Github</span>
              </TextureButton>
            </div>

            <div className="relative flex items-center gap-4 mb-6">
              <div className="h-px bg-paper/5 flex-1" />
              <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-paper/20">OR CONTINUE WITH</span>
              <div className="h-px bg-paper/5 flex-1" />
            </div>

            <form className="space-y-5" onSubmit={handleSignUp}>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 font-mono text-[10px] uppercase tracking-widest"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-paper/60 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-paper/20 group-focus-within:text-emerald-accent transition-colors" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Architect"
                    className="w-full bg-blueprint/40 border border-paper/10 rounded-xl px-12 py-4 font-mono text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-paper/60 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-paper/20 group-focus-within:text-emerald-accent transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="architect@example.com"
                    className="w-full bg-blueprint/40 border border-paper/10 rounded-xl px-12 py-4 font-mono text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-paper/60 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-paper/20 group-focus-within:text-emerald-accent transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-blueprint/40 border border-paper/10 rounded-xl px-12 py-4 font-mono text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-emerald-accent/50 focus:ring-1 focus:ring-emerald-accent/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" className="accent-emerald-accent" required />
                <span className="font-mono text-[10px] uppercase tracking-widest text-paper/40">I agree to the Terms of Service</span>
              </div>
              
              <TextureButton variant="accent" className="w-full h-14 mt-4" hoverText={isLoading ? "Creating Account..." : "Begin Construction"} type="submit" disabled={isLoading}>
                <div className="flex gap-2 items-center justify-center">
                  {isLoading ? "Signing Up..." : "Sign Up"}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </TextureButton>
            </form>
          </TextureCardContent>
          
          <TextureSeparator className="bg-paper/5" />
          
          <TextureCardFooter className="p-8 pt-0 flex flex-col gap-6">
            <div className="w-full bg-paper/5 rounded-2xl p-4 border border-paper/5">
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-paper/40">
                Already have an account?{" "}
                <Link to="/login" className="text-emerald-accent hover:underline">Sign In</Link>
              </p>
            </div>
          </TextureCardFooter>
        </TextureCardStyled>
      </motion.div>
    </div>
  );
}
