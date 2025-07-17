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
  const { user, session } = useAuth();
  const [members, setMembers] = useState<FamilyMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFamilyMembers() {
      console.log('👥 Loading family members...');
      if (!user || !session) {
        console.log('⚠️ No user/session found, skipping family members load');
        setLoading(false);
        return;
      }

      console.log('👥 Loading family members for user:', user.id);

      try {
        setLoading(true);
        setError(null);

        // Use the edge function to get family members with emails
        console.log('📡 Calling edge function to get family members...');
        const { data, error: functionError } = await supabase.functions.invoke('get-family-members', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        console.log('📡 Edge function result:', { data, functionError });
        
        if (functionError) {
          console.error('❌ Edge function error:', functionError);
          throw functionError;
        }

        if (data?.error) {
          console.error('❌ Function returned error:', data.error);
          throw new Error(data.error);
        }

        const familyMembers = data?.members || [];
        console.log('✅ Family members loaded:', familyMembers);
        setMembers(familyMembers);
      } catch (err: any) {
        console.error('❌ Error loading family members:', err);
        setError(err.message);
        
        // Fallback to the old method without emails if edge function fails
        console.log('⚠️ Falling back to profiles-only method...');
        try {
          // First get the user's family
          const { data: userRole, error: roleError } = await supabase
            .from('user_roles')
            .select('family_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (roleError || !userRole) {
            console.log('⚠️ User not part of any family');
            setMembers([]);
            return;
          }

          // Get all family members with their profiles
          const { data: familyMembers, error: membersError } = await supabase
            .from('user_roles')
            .select(`
              id,
              user_id,
              role,
              created_at
            `)
            .eq('family_id', userRole.family_id);

          if (membersError) throw membersError;

          // Get profiles for all users
          const userIds = familyMembers.map(member => member.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', userIds);

          const membersData: FamilyMemberData[] = familyMembers.map(member => {
            const profile = profiles?.find(p => p.user_id === member.user_id);
            return {
              id: member.id,
              user_id: member.user_id,
              name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown',
              email: 'Email not available',
              role: member.role,
              joinedAt: member.created_at
            };
          });
          
          console.log('✅ Fallback family members loaded:', membersData);
          setMembers(membersData);
          setError(null); // Clear the edge function error since fallback worked
        } catch (fallbackErr: any) {
          console.error('❌ Fallback method also failed:', fallbackErr);
          setError(fallbackErr.message);
        }
      } finally {
        setLoading(false);
        console.log('👥 Family members loading completed');
      }
    }

    loadFamilyMembers();
  }, [user, session]);

  return { members, loading, error };
}