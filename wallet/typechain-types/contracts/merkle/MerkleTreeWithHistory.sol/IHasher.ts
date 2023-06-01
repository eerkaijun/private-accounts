/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type { FunctionFragment, Result } from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../../../common";

export interface IHasherInterface extends utils.Interface {
  functions: {
    "poseidon(bytes32[2])": FunctionFragment;
  };

  getFunction(nameOrSignatureOrTopic: "poseidon"): FunctionFragment;

  encodeFunctionData(
    functionFragment: "poseidon",
    values: [[PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>]]
  ): string;

  decodeFunctionResult(functionFragment: "poseidon", data: BytesLike): Result;

  events: {};
}

export interface IHasher extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IHasherInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    poseidon(
      inputs: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>],
      overrides?: CallOverrides
    ): Promise<[string]>;
  };

  poseidon(
    inputs: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>],
    overrides?: CallOverrides
  ): Promise<string>;

  callStatic: {
    poseidon(
      inputs: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>],
      overrides?: CallOverrides
    ): Promise<string>;
  };

  filters: {};

  estimateGas: {
    poseidon(
      inputs: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>],
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    poseidon(
      inputs: [PromiseOrValue<BytesLike>, PromiseOrValue<BytesLike>],
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;
  };
}