'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export function TestSupabase() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: any = {};

    // Test 1: Basic connection
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      testResults.basicConnection = {
        success: !error,
        data: data,
        error: error
      };
    } catch (e: any) {
      testResults.basicConnection = {
        success: false,
        error: e.message
      };
    }

    // Test 2: Insert test user
    try {
      const testWallet = `test-${Date.now()}`;
      const { data, error } = await supabase
        .from('users')
        .insert({
          wallet_address: testWallet,
          username: 'Test User',
          avatar_url: '',
          avatar_type: 'default'
        })
        .select()
        .single();
      
      testResults.insertUser = {
        success: !error,
        data: data,
        error: error
      };
    } catch (e: any) {
      testResults.insertUser = {
        success: false,
        error: e.message
      };
    }

    // Test 3: Query specific user
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', 'N69CroxsB4BBPR7pm8JrGMUQgFo8KAgtAAqKdggnYTm')
        .maybeSingle();
      
      testResults.querySpecificUser = {
        success: !error,
        data: data,
        error: error
      };
    } catch (e: any) {
      testResults.querySpecificUser = {
        success: false,
        error: e.message
      };
    }

    // Test 4: Check Supabase URL and Key
    testResults.config = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) + '...',
      keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...',
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };

    setResults(testResults);
    setLoading(false);
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={runTests} disabled={loading}>
          {loading ? 'Running Tests...' : 'Run Tests'}
        </Button>
        
        {Object.keys(results).length > 0 && (
          <div className="mt-4 space-y-4">
            {Object.entries(results).map(([test, result]: [string, any]) => (
              <div key={test} className="border p-3 rounded">
                <h4 className="font-semibold">{test}</h4>
                <pre className="text-xs mt-2 overflow-auto max-h-40">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 