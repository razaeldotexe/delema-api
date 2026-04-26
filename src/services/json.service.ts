export class JsonService {
  static prettify(input: string): string {
    return JSON.stringify(JSON.parse(input), null, 2);
  }

  static minify(input: string): string {
    return JSON.stringify(JSON.parse(input));
  }

  static validate(input: string): { valid: boolean; error: string | null } {
    try {
      JSON.parse(input);
      return { valid: true, error: null };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  static diff(input1: string, input2: string): any {
    const obj1 = JSON.parse(input1);
    const obj2 = JSON.parse(input2);
    
    const changes: any = {
      added: {},
      removed: {},
      modified: {}
    };

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    for (const key of keys2) {
      if (!(key in obj1)) {
        changes.added[key] = obj2[key];
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        changes.modified[key] = {
          from: obj1[key],
          to: obj2[key]
        };
      }
    }

    for (const key of keys1) {
      if (!(key in obj2)) {
        changes.removed[key] = obj1[key];
      }
    }

    return {
      equal: keys1.length === keys2.length && Object.keys(changes.added).length === 0 && Object.keys(changes.removed).length === 0 && Object.keys(changes.modified).length === 0,
      changes
    };
  }
}
