import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FamilyInfo {
  id: string;
  name: string;
  join_code: string;
  role: 'family_admin' | 'family_member';
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
}

export function useFamilyData() {
  const { user } = useAuth();
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFamilyData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Profile error:', profileError);
        } else {
          setProfile(profileData);
        }

        // Load user's family information
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select(`
            role,
            family_id,
            families!inner(
              id,
              name,
              join_code
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError) {
          console.error('Family data error:', roleError);
          setError(roleError.message);
        } else if (userRole && userRole.families) {
          setFamilyInfo({
            id: userRole.families.id,
            name: userRole.families.name,
            join_code: userRole.families.join_code,
            role: userRole.role
          });
        }
      } catch (err: any) {
        console.error('Error loading family data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFamilyData();
  }, [user]);

  return { familyInfo, profile, loading, error };
}