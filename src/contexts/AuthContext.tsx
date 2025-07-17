import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  ensureFamilySetup: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const handleFamilySetup = async (user: User) => {
    console.log('🔍 Checking family setup for user:', user.id);
    
    try {
      // Check if user already has a family role
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('id, family_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🔍 Existing role check result:', { existingRole, roleCheckError });

      if (!existingRole) {
        console.log('⚠️ No existing family role found. Checking metadata for setup...');
        // User doesn't have a family role yet, check metadata for setup
        const signupType = user.user_metadata?.signup_type;
        const familyName = user.user_metadata?.family_name;
        const joinCode = user.user_metadata?.join_code;

        console.log('📝 Signup metadata:', { signupType, familyName, joinCode });

        if (signupType === 'admin' && familyName) {
          console.log('👑 User is admin, creating family...');
          await createFamily(user.id, familyName);
        } else if (signupType === 'member' && joinCode) {
          console.log('👥 User is member, joining family...');
          await joinFamily(user.id, joinCode);
        } else {
          console.log('⚠️ No family setup metadata found');
        }
      } else {
        console.log('✅ User already has family role:', existingRole);
      }
    } catch (error) {
      console.error('❌ Error during family setup:', error);
    }
  };

  const createFamily = async (userId: string, familyName: string) => {
    console.log('🏠 Creating family with name:', familyName);
    try {
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

      if (familyError) throw familyError;

      console.log('🏠 Family created successfully:', family);
      
      // Add user as family admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          family_id: family.id,
          role: 'family_admin'
        });

      if (roleError) throw roleError;

      console.log('✅ Family setup completed successfully!');
      toast.success(`Family "${familyName}" created! Your join code is: ${family.join_code}`);
    } catch (error: any) {
      console.error('❌ Error creating family:', error);
      toast.error(error.message || "Failed to create family");
    }
  };

  const joinFamily = async (userId: string, joinCode: string) => {
    console.log('👥 Joining family with code:', joinCode);
    try {
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

      console.log('✅ Successfully joined family');
      toast.success(`Successfully joined "${family.name}" family!`);
    } catch (error: any) {
      console.error('❌ Error joining family:', error);
      toast.error(error.message || "Failed to join family");
    }
  };

  const ensureFamilySetup = async () => {
    if (user) {
      await handleFamilySetup(user);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle family setup after authentication
        if (session?.user) {
          setTimeout(() => {
            handleFamilySetup(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle family setup for existing session
      if (session?.user) {
        setTimeout(() => {
          handleFamilySetup(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    ensureFamilySetup,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}