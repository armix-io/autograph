import { MaybePromise } from "../types/utils";
import { Type, Scalar } from "../types/type";
import { Typed, AsScalar } from "../types/type-utils";
import { FieldHooks } from "../types/hooks";
import { Context } from "../types/context";
import { Info } from "../types/info";
import { Getter, Setter, GetResolver, SetResolver } from "./field";

export type Options<Source> = {
  alias?: Exclude<keyof Source, number | symbol>;
  get?: Getter<Source> | null;
  set?: Setter<Source | undefined, Partial<Source>> | null;
  setCreate?: Setter<undefined, Partial<Source>> | null;
  setUpdate?: Setter<Source> | null;
  setAfterData?: Setter<Source, void>;
  setCreateAfterData?: Setter<Source, void>;
  setUpdateAfterData?: Setter<Source, void>;
  hooks?: Partial<FieldHooks<Source>>;
  orderTarget?: Exclude<keyof Source, number | symbol>;
  filterTarget?: Exclude<keyof Source, number | symbol>;
  defaultFilters?: boolean;
};

export type OptionsCallback<
  Source,
  GetType extends Type,
  SetType extends Scalar
> = (mappers: {
  get: GetMapper<Source, GetType>;
  set: SetMapper<Source, SetType>;
}) => Options<Source>;

/**
 * MAPPERS
 */

export interface GetMapper<Source, T extends Type> {
  (
    resolver: (
      source: Source,
      context: Context,
      info: Info
    ) => MaybePromise<Typed<T>>
  ): {
    args: {};
    resolver: GetResolver<Source, T, {}>;
  };
  args<A extends Record<string, Scalar>>(
    args: A
  ): (
    resolver: GetResolver<Source, T, A>
  ) => {
    args: A;
    resolver: GetResolver<Source, T, A>;
  };
}

type WithoutSource<R extends SetResolver> = (
  value: Parameters<R>[0],
  context: Parameters<R>[2],
  info: Parameters<R>[3]
) => ReturnType<R>;

type AfterData<Source, T extends Scalar> = {
  (resolver: SetResolver<Source, T, void>): Setter<Source, void>;
};

export interface SetMapper<Source, T extends Scalar> {
  (resolver: SetResolver<Source | undefined, T, Partial<Source>>): Setter<
    Source | undefined,
    Partial<Source>
  >;
  afterData: AfterData<Source, T>;

  create: {
    (resolver: WithoutSource<SetResolver<Source, T>>): Setter<
      Source | undefined,
      Partial<Source>
    >;
    afterData: AfterData<Source, T>;
  };

  update: {
    (resolver: SetResolver<Source, T>): Setter<Source>;
    afterData: AfterData<Source, T>;
  };
}