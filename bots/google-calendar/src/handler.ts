import { Discord } from '@package/discord';

export const hello = () => {
  const discord = new Discord(
    PropertiesService.getScriptProperties().getProperty('DISCORD_WEBHOOK_URL') ?? '',
  );

  discord.sendPost({
    content: 'テストだよ～',
    embeds: [
      {
        title: 'テストなり',
        description: 'テスト説明です。',
        color: '#f766a3',
      },
    ],
  });
};
