import { ILeadOperationRequest, LeadOperationRequest } from '../protobuffs/messages'

// Encode LeadOperationRequest to "0x"-prefixed hex string
export function encodeLeadOperation(operation: ILeadOperationRequest): string {
  return '0x' + Buffer.from(LeadOperationRequest.encode(operation).finish()).toString('hex')
}

// Decode LeadOperationRequest from "0x"-prefixed hex string
export function decodeLeadOperation(hexString: string): LeadOperationRequest {
  return LeadOperationRequest.decode(Buffer.from(hexString.replace('0x', ''), 'hex'))
}
