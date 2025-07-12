import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useFamilySetupCheck() {
  const { user } = useAuth();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkFamilySetup() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has a family role
        const { data: userRole, error } = await supabase
          .from('user_roles')
          .select('family_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking user role:', error);
          setLoading(false);
          return;
        }

        // If user has no family role, check if they need family setup
        if (!userRole) {
          // Check user metadata for signup type
          const signupType = user.user_metadata?.signup_type;
          const familyName = user.user_metadata?.family_name;
          const joinCode = user.user_metadata?.join_code;

          if (signupType === 'admin' && familyName) {
            // Create family for admin user
            await createFamilyForUser(familyName);
          } else if (signupType === 'member' && joinCode) {
            // Join family for member user
            await joinFamilyForUser(joinCode);
          } else {
            setNeedsSetup(true);
          }
        }
      } catch (error) {
        console.error('Error in family setup check:', error);
      } finally {
        setLoading(false);
      }
    }

    checkFamilySetup();
  }, [user]);

  const createFamilyForUser = async (familyName: string) => {
    if (!user) return;

    try {
      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert([{
          name: familyName,
          created_by: user.id,
          join_code: 'TEMP' // Will be replaced by trigger
        }])
        .select()
        .single();

      if (familyError) throw familyError;

      // Add user as family admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          family_id: family.id,
          role: 'family_admin'
        });

      if (roleError) throw roleError;

      toast.success(`Family "${familyName}" created! Your join code is: ${family.join_code}`);
      
      // Force page reload to refresh all family data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast.error(error.message || "Failed to create family");
      setNeedsSetup(true);
    }
  };

  const joinFamilyForUser = async (joinCode: string) => {
    if (!user) return;

    try {
      // Find family by join code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (familyError) {
        toast.error("Invalid join code");
        setNeedsSetup(true);
        return;
      }

      // Add user as family member
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          family_id: family.id,
          role: 'family_member'
        });

      if (roleError) throw roleError;

      toast.success(`Successfully joined "${family.name}" family!`);
      
      // Force page reload to refresh all family data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error joining family:', error);
      toast.error(error.message || "Failed to join family");
      setNeedsSetup(true);
    }
  };

  return { needsSetup, loading };
}