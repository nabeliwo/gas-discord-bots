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
    return UrlFetchApp.fetch(this.webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        content: body.content,
        embeds: body.embeds.map((embed) => ({
          ...embed,
          color: parseInt(embed.color.slice(1), 16),
        })),
      }),
    });
  }
}
