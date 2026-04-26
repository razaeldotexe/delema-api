export class TimeService {
  private static formatDate(d: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const year = d.getUTCFullYear();
    const hours = d.getUTCHours().toString().padStart(2, '0');
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes} UTC`;
  }

  static now(): any {
    const d = new Date();
    return {
      unix: Math.floor(d.getTime() / 1000),
      iso: d.toISOString(),
      readable: this.formatDate(d)
    };
  }

  static convert(input: string | number): any {
    let d: Date;
    if (typeof input === 'number') {
      // Check if it's seconds or milliseconds
      // 10^12 is approx year 2001 in milliseconds.
      // If input is less than that, it's likely seconds (unless it's a very old date)
      if (input < 10000000000) {
        d = new Date(input * 1000);
      } else {
        d = new Date(input);
      }
    } else {
      d = new Date(input);
    }

    if (isNaN(d.getTime())) {
      throw new Error('Invalid date/timestamp');
    }

    return {
      unix: Math.floor(d.getTime() / 1000),
      iso: d.toISOString(),
      readable: this.formatDate(d)
    };
  }
}
