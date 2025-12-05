'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAnchorProvider } from '@/hooks/useAnchorProvider';
import { useDAORequirements } from '@/hooks/useDAORequirements';
import { useUpdateDAOConfig } from '@/hooks/useUpdateDAOConfig';
import { fetchDaoState } from '@/lib/anchor-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AlertCircle, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

interface ConfigForm {
  nftRequired: boolean;
  nftCollection: string;
  nftVerifiedCollection: boolean;
  tokenRequired: boolean;
  tokenMint: string;
  minTokenAmount: string;
  requireBoth: boolean;
}

interface DAOConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DAOConfigModal({ open, onOpenChange }: DAOConfigModalProps) {
  const { data: currentConfig } = useDAORequirements();
  const { mutate: updateConfig, isPending } = useUpdateDAOConfig();
  const { connection } = useAnchorProvider();
  const { publicKey } = useWallet();
  const [isAuthority, setIsAuthority] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ConfigForm>({
    defaultValues: {
      nftRequired: false,
      nftCollection: '',
      nftVerifiedCollection: false,
      tokenRequired: false,
      tokenMint: '',
      minTokenAmount: '0',
      requireBoth: false,
    },
  });

  // Check if user is authority
  useEffect(() => {
    const checkAuthority = async () => {
      if (!publicKey) {
        setIsAuthority(false);
        setCheckingAuth(false);
        return;
      }
      
      try {
        const daoState = await fetchDaoState(connection);
        if (daoState) {
          setIsAuthority(daoState.authority.equals(publicKey));
        }
      } catch (error) {
        console.error('Error checking authority:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuthority();
  }, [publicKey, connection]);

  // Update form with current config
  useEffect(() => {
    if (currentConfig) {
      setValue('nftRequired', currentConfig.nftRequired);
      setValue('nftCollection', currentConfig.nftCollection || '');
      setValue('nftVerifiedCollection', currentConfig.nftVerifiedCollection);
      setValue('tokenRequired', currentConfig.tokenRequired);
      setValue('tokenMint', currentConfig.tokenMint || '');
      setValue('minTokenAmount', currentConfig.minTokenAmount.toString());
      setValue('requireBoth', currentConfig.requireBoth);
    }
  }, [currentConfig, setValue]);

  const nftRequired = watch('nftRequired');
  const tokenRequired = watch('tokenRequired');

  const onSubmit = (data: ConfigForm) => {
    try {
      const config = {
        nftRequired: data.nftRequired,
        nftCollection: data.nftRequired && data.nftCollection ? new PublicKey(data.nftCollection) : null,
        nftVerifiedCollection: data.nftVerifiedCollection,
        tokenRequired: data.tokenRequired,
        tokenMint: data.tokenRequired && data.tokenMint ? new PublicKey(data.tokenMint) : null,
        minTokenAmount: parseInt(data.minTokenAmount) || 0,
        requireBoth: data.requireBoth,
      };
      
      updateConfig(config, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    } catch (error) {
      console.error('Invalid configuration:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Configure Voting Requirements</DialogTitle>
            <DialogDescription>
              Set requirements that users must meet to participate in voting.
            </DialogDescription>
          </DialogHeader>

          {checkingAuth ? (
            <div className="py-8 text-center text-muted-foreground">
              Checking authority...
            </div>
          ) : !isAuthority ? (
            <Alert className="my-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only the DAO authority can modify voting requirements.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-6 py-6">
              {/* NFT Requirements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>NFT Requirement</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to hold an NFT from a specific collection
                    </p>
                  </div>
                  <Switch 
                    checked={nftRequired}
                    onCheckedChange={(checked) => setValue('nftRequired', checked)}
                  />
                </div>

                {nftRequired && (
                  <>
                    <div>
                      <Label>NFT Collection Address</Label>
                      <Input
                        {...register('nftCollection', {
                          required: nftRequired ? 'Collection address is required' : false,
                          validate: (value) => {
                            if (!nftRequired || !value) return true;
                            try {
                              new PublicKey(value);
                              return true;
                            } catch {
                              return 'Invalid Solana address';
                            }
                          },
                        })}
                        placeholder="Enter collection address..."
                        className="font-mono text-sm"
                      />
                      {errors.nftCollection && (
                        <p className="text-sm text-destructive mt-1">{errors.nftCollection.message}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={watch('nftVerifiedCollection')}
                        onCheckedChange={(checked) => setValue('nftVerifiedCollection', checked)}
                      />
                      <Label>Require verified collection</Label>
                    </div>
                  </>
                )}
              </div>

              {/* Token Requirements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Token Requirement</Label>
                    <p className="text-sm text-muted-foreground">
                      Require users to hold a minimum amount of tokens
                    </p>
                  </div>
                  <Switch 
                    checked={tokenRequired}
                    onCheckedChange={(checked) => setValue('tokenRequired', checked)}
                  />
                </div>

                {tokenRequired && (
                  <>
                    <div>
                      <Label>Token Mint Address</Label>
                      <Input
                        {...register('tokenMint', {
                          required: tokenRequired ? 'Token mint is required' : false,
                          validate: (value) => {
                            if (!tokenRequired || !value) return true;
                            try {
                              new PublicKey(value);
                              return true;
                            } catch {
                              return 'Invalid Solana address';
                            }
                          },
                        })}
                        placeholder="Enter token mint address..."
                        className="font-mono text-sm"
                      />
                      {errors.tokenMint && (
                        <p className="text-sm text-destructive mt-1">{errors.tokenMint.message}</p>
                      )}
                    </div>

                    <div>
                      <Label>Minimum Token Amount</Label>
                      <Input
                        {...register('minTokenAmount', {
                          required: tokenRequired ? 'Minimum amount is required' : false,
                          min: { value: 1, message: 'Must be at least 1' },
                        })}
                        type="number"
                        placeholder="Enter minimum amount..."
                      />
                      {errors.minTokenAmount && (
                        <p className="text-sm text-destructive mt-1">{errors.minTokenAmount.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Combined Requirements */}
              {nftRequired && tokenRequired && (
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={watch('requireBoth')}
                      onCheckedChange={(checked) => setValue('requireBoth', checked)}
                    />
                    <Label>Require both NFT and tokens</Label>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      When enabled, users must meet both requirements. When disabled, 
                      users need to meet at least one requirement.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {isAuthority && (
              <Button type="submit" disabled={isPending || checkingAuth}>
                {isPending ? 'Updating...' : 'Update Requirements'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}