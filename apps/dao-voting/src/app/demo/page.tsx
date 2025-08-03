'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function ButtonDemoPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Button Style Guide</h1>
      <p className="text-muted-foreground mb-8">
        Showcasing the updated button hierarchy for the Solana DAO app
      </p>
      
      <div className="space-y-8">
        {/* Visual Hierarchy Example */}
        <Card>
          <CardHeader>
            <CardTitle>Visual Hierarchy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Buttons ordered by visual prominence
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button>Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Tertiary Action</Button>
            <Button variant="ghost">Minimal Action</Button>
          </CardContent>
        </Card>

        {/* Voting Example */}
        <Card>
          <CardHeader>
            <CardTitle>Voting Interface</CardTitle>
            <p className="text-sm text-muted-foreground">
              How the buttons work in the voting context
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <Button className="w-full">Vote Yes</Button>
              <Button variant="destructive" className="w-full">Vote No</Button>
              <Button variant="secondary" className="w-full">Abstain</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              The "Abstain" option now has a distinct secondary style that's less prominent than Yes/No
            </p>
          </CardContent>
        </Card>

        {/* All Variants */}
        <Card>
          <CardHeader>
            <CardTitle>All Button Variants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button size="sm">Small</Button>
              <Button>Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Settings className="h-4 w-4" /></Button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>Disabled</Button>
              <Button variant="ghost" disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Primary (Default)</h4>
              <p className="text-muted-foreground">Main CTAs: Create, Submit, Save, Connect Wallet</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Secondary</h4>
              <p className="text-muted-foreground">Alternative actions: Abstain, Maybe Later, Save Draft</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Outline</h4>
              <p className="text-muted-foreground">Neutral actions: View Details, Options, Filters</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Ghost</h4>
              <p className="text-muted-foreground">Minimal actions: Cancel, Close, Icon buttons</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Destructive</h4>
              <p className="text-muted-foreground">Dangerous actions: Delete, Remove, Vote No</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 