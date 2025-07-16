import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FamilyMemberData {
  id: string;
  name: string;
  email: string;
  role: 'family_admin' | 'family_member';
  joinedAt: string;
  user_id: string;
}

export function useFamilyMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFamilyMembers() {
      console.log('👥 Loading family members...');
      if (!user) {
        console.log('⚠️ No user found, skipping family members load');
        setLoading(false);
        return;
      }

      console.log('👥 Loading family members for user:', user.id);

      try {
        setLoading(true);
        setError(null);

        // First get the user's family
        console.log('🔍 Getting user family role...');
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('family_id')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('🔍 User role result:', { userRole, roleError });

        if (roleError || !userRole) {
          console.error('❌ Error getting user family:', roleError);
          setMembers([]);
          return;
        }

        console.log('✅ User family ID:', userRole.family_id);

        // Get all family members with their profiles
        console.log('👥 Getting all family members...');
        const { data: familyMembers, error: membersError } = await supabase
          .from('user_roles')
          .select(`
            id,
            user_id,
            role,
            created_at
          `)
          .eq('family_id', userRole.family_id);

        console.log('👥 Family members result:', { familyMembers, membersError });

        if (membersError) {
          console.error('❌ Error loading family members:', membersError);
          setError(membersError.message);
          return;
        }

        if (familyMembers) {
          console.log('✅ Found', familyMembers.length, 'family members');
          
          // Get profiles for all users
          const userIds = familyMembers.map(member => member.user_id);
          console.log('👤 Getting profiles for user IDs:', userIds);
          
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', userIds);

          console.log('👤 Profiles result:', { profiles, profilesError });

          const membersData: FamilyMemberData[] = familyMembers.map(member => {
            const profile = profiles?.find(p => p.user_id === member.user_id);
            const memberData = {
              id: member.id,
              user_id: member.user_id,
              name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
              email: '', // We don't have email in profiles, would need auth.users
              role: member.role,
              joinedAt: member.created_at
            };
            console.log('👤 Processed member:', memberData);
            return memberData;
          });
          
          console.log('✅ Final members data:', membersData);
          setMembers(membersData);
        }
      } catch (err: any) {
        console.error('❌ Error loading family members:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log('👥 Family members loading completed');
      }
    }

    loadFamilyMembers();
  }, [user]);

  return { members, loading, error };
}