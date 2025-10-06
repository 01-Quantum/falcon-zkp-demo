declare module 'snarkjs' {
  export namespace groth16 {
    function fullProve(
      input: any,
      wasmFile: string,
      zkeyFileName: string
    ): Promise<{ proof: any; publicSignals: any[] }>;

    function verify(
      vKey: any,
      publicSignals: any[],
      proof: any
    ): Promise<boolean>;

    function prove(
      zkeyFileName: string,
      witnessFileName: string
    ): Promise<{ proof: any; publicSignals: any[] }>;

    function exportSolidityCallData(
      proof: any,
      publicSignals: any[]
    ): Promise<string>;
  }

  export namespace plonk {
    function fullProve(
      input: any,
      wasmFile: string,
      zkeyFileName: string
    ): Promise<{ proof: any; publicSignals: any[] }>;

    function verify(
      vKey: any,
      publicSignals: any[],
      proof: any
    ): Promise<boolean>;
  }

  export namespace wtns {
    function calculate(
      input: any,
      wasmFileName: string,
      witnessFileName: string
    ): Promise<void>;
  }

  export namespace zKey {
    function exportVerificationKey(zkeyName: string): Promise<any>;
  }
}

