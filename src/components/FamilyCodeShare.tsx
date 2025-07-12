import { useState } from 'react';
import { Copy, Share2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface FamilyCodeShareProps {
  familyName: string;
  joinCode: string;
  isAdmin: boolean;
}

export function FamilyCodeShare({ familyName, joinCode, isAdmin }: FamilyCodeShareProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopied(true);
      toast.success('Join code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy join code');
    }
  };

  const shareInviteLink = async () => {
    const message = `Join our family "${familyName}" on FamPlan! Use code: ${joinCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${familyName} Family`,
          text: message,
        });
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        await navigator.clipboard.writeText(message);
        toast.success('Invite message copied to clipboard!');
      }
    } else {
      // Fallback for browsers without Web Share API
      await navigator.clipboard.writeText(message);
      toast.success('Invite message copied to clipboard!');
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Information
          </CardTitle>
          <CardDescription>
            You're a member of the {familyName} family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="family-code">Family Join Code</Label>
            <div className="flex gap-2">
              <Input
                id="family-code"
                value={joinCode}
                readOnly
                className="font-mono text-lg text-center tracking-wider"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this code with family members so they can join
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invite Family Members
        </CardTitle>
        <CardDescription>
          Share your family join code to invite new members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="family-code">Family Join Code</Label>
          <div className="flex gap-2">
            <Input
              id="family-code"
              value={joinCode}
              readOnly
              className="font-mono text-lg text-center tracking-wider"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={shareInviteLink}
            className="flex-1"
            variant="default"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Invite
          </Button>
        </div>

        <div className="bg-muted p-3 rounded-md text-sm">
          <p className="font-medium mb-1">How to invite family members:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Share the join code above with family members</li>
            <li>They can create an account and select "Join Family"</li>
            <li>Enter the code to join your family</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}