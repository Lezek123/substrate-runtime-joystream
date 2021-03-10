/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * JSON schema to describe Joystream working group opening
 */
export interface WorkingGroupOpening {
  /**
   * Staking policy
   */
  stakingPolicy?: {
    /**
     * Stake amount
     */
    amount: number;
    /**
     * Unstaking period in blocks
     */
    unstakingPeriod: number;
  };
  /**
   * Reward per block
   */
  rewardPerBlock?: number;
}
