import { useState } from 'react';
import { Users, UserPlus, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FamilySetupProps {
  onComplete: () => void;
}

export function FamilySetup({ onComplete }: FamilySetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const createFamily = async () => {
    if (!familyName.trim() || !user) {
      toast.error('Please enter a family name');
      return;
    }

    setLoading(true);
    try {
      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert([{
          name: familyName.trim(),
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

      toast.success(`Family "${familyName}" created successfully!`);
      onComplete();
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast.error(error.message || 'Failed to create family');
    } finally {
      setLoading(false);
    }
  };

  const joinFamily = async () => {
    if (!joinCode.trim() || !user) {
      toast.error('Please enter a join code');
      return;
    }

    setLoading(true);
    try {
      // Find family by join code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('join_code', joinCode.toUpperCase().trim())
        .single();

      if (familyError) {
        toast.error('Invalid join code');
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
      onComplete();
    } catch (error: any) {
      console.error('Error joining family:', error);
      toast.error(error.message || 'Failed to join family');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Setup</CardTitle>
          <CardDescription>
            Create a new family or join an existing one to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Family</TabsTrigger>
              <TabsTrigger value="join">Join Family</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Create a new family and become the admin</span>
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
                  onClick={createFamily} 
                  disabled={loading || !familyName.trim()} 
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Family
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="join" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  <span>Join an existing family with a join code</span>
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
                  onClick={joinFamily} 
                  disabled={loading || !joinCode.trim()} 
                  className="w-full"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join Family
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}