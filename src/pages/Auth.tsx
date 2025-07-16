import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Users, UserPlus, Key } from "lucide-react";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showEmailNote, setShowEmailNote] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (type: 'admin' | 'member') => {
    if (!email || !password || !firstName || !lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (type === 'admin' && !familyName) {
      toast.error("Please enter a family name");
      return;
    }

    if (type === 'member' && !joinCode) {
      toast.error("Please enter a family join code");
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
            signup_type: type,
            family_name: type === 'admin' ? familyName : undefined,
            join_code: type === 'member' ? joinCode : undefined,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Don't create family here - do it after email verification and signin
        toast.success("Account created! Please check your email and click the verification link before signing in.", {
          duration: 8000
        });
        setShowEmailNote(true);
        // Don't navigate immediately - user needs to verify email first
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async (userId: string) => {
    try {
      // Get the family name from user metadata or state
      const { data: { user } } = await supabase.auth.getUser();
      const metaFamilyName = user?.user_metadata?.family_name || familyName;
      
      if (!metaFamilyName) {
        toast.error("Family name not found");
        return;
      }

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert([{
          name: metaFamilyName,
          created_by: userId,
          join_code: 'TEMP' // Will be replaced by trigger
        }])
        .select()
        .single();

      if (familyError) throw familyError;

      // Add user as family admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          family_id: family.id,
          role: 'family_admin'
        });

      if (roleError) throw roleError;

      toast.success(`Family "${metaFamilyName}" created! Your join code is: ${family.join_code}`);
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast.error(error.message || "Failed to create family");
    }
  };

  const joinFamily = async (userId: string) => {
    try {
      // Get the join code from user metadata or state
      const { data: { user } } = await supabase.auth.getUser();
      const metaJoinCode = user?.user_metadata?.join_code || joinCode;
      
      if (!metaJoinCode) {
        toast.error("Join code not found");
        return;
      }

      // Find family by join code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('join_code', metaJoinCode.toUpperCase())
        .single();

      if (familyError) {
        toast.error("Invalid join code");
        return;
      }

      // Add user as family member
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          family_id: family.id,
          role: 'family_member'
        });

      if (roleError) throw roleError;

      toast.success(`Successfully joined "${family.name}" family!`);
    } catch (error: any) {
      console.error('Error joining family:', error);
      toast.error(error.message || "Failed to join family");
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Check if user already has a family role first
        const { data: existingRole } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!existingRole) {
          // User doesn't have a family role yet, check metadata for setup
          const signupType = data.user.user_metadata?.signup_type;
          const familyName = data.user.user_metadata?.family_name;
          const joinCode = data.user.user_metadata?.join_code;

          if (signupType === 'admin' && familyName) {
            // Create family for admin user
            await createFamily(data.user.id);
          } else if (signupType === 'member' && joinCode) {
            // Join family for member user
            await joinFamily(data.user.id);
          }
        }
      }

      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?tab=signin`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password reset email sent! Check your inbox.");
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Family Dashboard</CardTitle>
          <CardDescription>
            Sign in to your account or create a new family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="create-family">Create Family</TabsTrigger>
              <TabsTrigger value="join-family">Join Family</TabsTrigger>
              <TabsTrigger value="reset">Reset Password</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-4">
                {showEmailNote && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                    <strong>Note:</strong> Please check your email and click the verification link before signing in.
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSignIn} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="create-family" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Create a new family and become the admin</span>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-first-name">First Name</Label>
                    <Input
                      id="admin-first-name"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-last-name">Last Name</Label>
                    <Input
                      id="admin-last-name"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="family-name">Family Name</Label>
                  <Input
                    id="family-name"
                    type="text"
                    placeholder="Enter your family name"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={() => handleSignUp('admin')} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Family & Account
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="join-family" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  <span>Join an existing family with a join code</span>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-first-name">First Name</Label>
                    <Input
                      id="member-first-name"
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-last-name">Last Name</Label>
                    <Input
                      id="member-last-name"
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-password">Password</Label>
                  <Input
                    id="member-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join-code">Family Join Code</Label>
                  <Input
                    id="join-code"
                    type="text"
                    placeholder="Enter the 6-digit code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>
                <Button 
                  onClick={() => handleSignUp('member')} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Join Family & Create Account
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="reset" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Key className="h-4 w-4" />
                  <span>Reset your password via email</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handlePasswordReset} 
                  disabled={resetLoading} 
                  className="w-full"
                >
                  {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Email
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;