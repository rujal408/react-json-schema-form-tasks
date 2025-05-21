declare module 'json-rules-engine-simplified' {
  export default class Engine {
    constructor();
    addRule(rule: any): void;
    run(facts: any): Promise<any>;
  }
} 