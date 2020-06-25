import { Struct, Option, Text, bool, Vec, u16, u32, u64, getTypeRegistry } from "@polkadot/types";
import { BlockNumber, Moment } from '@polkadot/types/interfaces';
import { Codec } from "@polkadot/types/types";
import { JoyStruct } from './JoyStruct';
export { JoyStruct } from './JoyStruct';
import { ModerationAction } from './forum';

export class CircularDependency extends ModerationAction {}

// Treat a BTreeSet as a Vec since it is encoded in the same way
export class BTreeSet<T extends Codec> extends Vec<T> {}

export class Credential extends u64 {}
export class CredentialSet extends Vec.with(Credential) {} // BtreeSet ?

// common types between Forum and Proposal Discussions modules
export class ThreadId extends u64 {}
export class PostId extends u64 {}

export type BlockAndTimeType = {
    block: BlockNumber,
    time: Moment
};

export class BlockAndTime extends Struct {
    constructor (value?: BlockAndTimeType) {
        super({
            block: u32, // BlockNumber
            time: u64, // Moment
        }, value);
    }

    get block (): BlockNumber {
        return this.get('block') as BlockNumber;
    }

    get time (): Moment {
        return this.get('time') as Moment;
    }

    static newEmpty (): BlockAndTime {
        return new BlockAndTime({} as BlockAndTime);
    }
}

export function getTextPropAsString(struct: Struct, fieldName: string): string {
    return (struct.get(fieldName) as Text).toString();
}

export function getBoolPropAsBoolean(struct: Struct, fieldName: string): boolean {
    return (struct.get(fieldName) as bool).valueOf();
}

export function getOptionPropOrUndefined<T extends Codec>(struct: Struct, fieldName: string): T | undefined {
    return (struct.get(fieldName) as Option<T>).unwrapOr(undefined);
}

export class OptionText extends Option.with(Text) {
    static none(): OptionText {
        return new Option(Text, null);
    }

    static some(text: string): OptionText {
        return new Option(Text, text);
    }
}

export type InputValidationLengthConstraintType = {
    min: u16,
    max_min_diff: u16
};

export class InputValidationLengthConstraint extends JoyStruct<InputValidationLengthConstraintType> {
    constructor (value: InputValidationLengthConstraintType) {
      super({
        min: u16,
        max_min_diff: u16
      }, value);
    }

    get min (): u16 {
      return this.getField('min');
    }

    get max_min_diff (): u16 {
      return this.getField('max_min_diff');
    }

    get max (): u16 {
      return new u16(this.min.add(this.max_min_diff));
    }
}

export function registerCommonTypes() {
    const typeRegistry = getTypeRegistry();

    typeRegistry.register({
      Credential,
      CredentialSet,
      BlockAndTime,
      ThreadId,
      PostId,
      InputValidationLengthConstraint,
      BTreeSet // Is this even necessary?
    });
}
