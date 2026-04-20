type PostBody = {
  content: string;
  embeds: Array<{
    title: string;
    description?: string;
    color: string;
    footer?: {
      text: string;
    };
    fields?: Array<{
      name: string;
      value: string;
    }>;
  }>;
};

export class Discord {
  constructor(private webhookUrl: string) {}

  sendPost(body: PostBody) {
    const payload = JSON.stringify({
      content: body.content,
      embeds: body.embeds.map((embed) => ({
        ...embed,
        color: parseInt(embed.color.slice(1), 16),
      })),
    });

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      const response = UrlFetchApp.fetch(this.webhookUrl, {
        method: 'post',
        contentType: 'application/json',
        payload,
        muteHttpExceptions: true,
      });

      if (response.getResponseCode() !== 429) {
        return response;
      }

      if (i === maxRetries - 1) {
        throw new Error(`Discord webhook rate limited after ${maxRetries} retries`);
      }

      // Retry-After ヘッダーがあればその値を、なければ線形バックオフを使用
      const headers = response.getHeaders() as Record<string, string>;
      const retryAfterSec = parseFloat(headers['Retry-After'] ?? headers['retry-after'] ?? '0');
      const waitMs = retryAfterSec > 0 ? retryAfterSec * 1000 : 2000 * (i + 1);
      Utilities.sleep(waitMs);
    }
  }
}
