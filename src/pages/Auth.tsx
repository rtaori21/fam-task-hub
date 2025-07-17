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
    console.log('🏠 Starting family creation for user:', userId);
    try {
      // Get the family name from user metadata
      const { data: { user } } = await supabase.auth.getUser();
      const familyName = user?.user_metadata?.family_name;
      
      console.log('🏠 Family name from metadata:', familyName);
      
      if (!familyName) {
        console.error('❌ Family name not found');
        toast.error("Family name not found");
        return;
      }

      console.log('🏠 Creating family with name:', familyName);
      // Create family - the trigger will automatically generate a unique join code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert([{
          name: familyName,
          created_by: userId,
          join_code: 'TEMP' // This will be replaced by the database trigger
        }])
        .select()
        .single();

      console.log('🏠 Family creation result:', { family, familyError });
      if (familyError) {
        console.error('❌ Family creation error:', familyError);
        throw familyError;
      }

      console.log('🏠 Family created successfully:', family);
      console.log('🏠 Generated join code:', family.join_code);

      // Add user as family admin
      console.log('👤 Adding user as family admin...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          family_id: family.id,
          role: 'family_admin'
        });

      console.log('👤 Role creation result:', { roleError });
      if (roleError) {
        console.error('❌ Role creation error:', roleError);
        throw roleError;
      }

      console.log('✅ Family setup completed successfully!');
      toast.success(`Family "${familyName}" created! Your join code is: ${family.join_code}`);
    } catch (error: any) {
      console.error('❌ Error creating family:', error);
      toast.error(error.message || "Failed to create family");
    }
  };

  const joinFamily = async (userId: string) => {
    try {
      // Get the join code from user metadata
      const { data: { user } } = await supabase.auth.getUser();
      const joinCode = user?.user_metadata?.join_code;
      
      if (!joinCode) {
        toast.error("Join code not found");
        return;
      }

      // Find family by join code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
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
    console.log('🔐 Starting sign in process...');
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Attempting to sign in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 Sign in result:', { user: data.user?.id, error });
      if (error) {
        console.error('❌ Sign in error:', error);
        toast.error(error.message);
        return;
      }

      if (data.user) {
        console.log('✅ User signed in successfully:', data.user.id);
        // Family setup will be handled by AuthContext automatically
      }

      toast.success("Welcome back!");
      navigate("/");
    } catch (error: any) {
      console.error('❌ Sign in process error:', error);
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