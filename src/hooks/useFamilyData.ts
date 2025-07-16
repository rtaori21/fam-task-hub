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
      console.log('📊 Loading family data...');
      if (!user) {
        console.log('⚠️ No user found, skipping family data load');
        setLoading(false);
        return;
      }

      console.log('📊 Loading family data for user:', user.id);

      try {
        setLoading(true);
        setError(null);

        // Load user profile
        console.log('👤 Loading user profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('👤 Profile result:', { profileData, profileError });
        if (profileError) {
          console.error('❌ Profile error:', profileError);
        } else {
          setProfile(profileData);
          console.log('✅ Profile loaded:', profileData);
        }

        // Load user's family information
        console.log('🏠 Loading family information...');
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

        console.log('🏠 Family data result:', { userRole, roleError });
        if (roleError) {
          console.error('❌ Family data error:', roleError);
          setError(roleError.message);
        } else if (userRole && userRole.families) {
          const familyInfo = {
            id: userRole.families.id,
            name: userRole.families.name,
            join_code: userRole.families.join_code,
            role: userRole.role
          };
          console.log('✅ Family info loaded:', familyInfo);
          setFamilyInfo(familyInfo);
        } else {
          console.log('⚠️ No family data found for user');
          setFamilyInfo(null);
        }
      } catch (err: any) {
        console.error('❌ Error loading family data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log('📊 Family data loading completed');
      }
    }

    loadFamilyData();
  }, [user]);

  return { familyInfo, profile, loading, error };
}