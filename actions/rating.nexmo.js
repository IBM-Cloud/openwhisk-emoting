function main(args) {
  console.log('rating.nexmo', args);

  // args.text is the message body for this inbound message.
  if (!args.text) {
    console.log('[KO] No text specified');
    return { ok: false };
  }

  const message = args.text.trim();
  const firstSpace = message.indexOf(' ');

  // https://en.wikipedia.org/wiki/Emoticons_(Unicode_block)
  const ratings = {
    verygood: ['😁', '😂', '😃', '😊', '😍', '😎', '😏', '😛', '😜', '😝', '🤘'],
    good: ['😀', '😄', '😅', '😆', '😉', '🙂'],
    bad: ['😐', '😑', '😒', '😓', '😔', '😕', '😟', '😧', '😪', '🙁', '🙃', '🤨'],
    verybad: ['😖', '😞', '😠', '😡', '😢', '😣', '😤', '😥', '😫', '😭', '😩', '🙄']
  };

  const keyword = message.slice(0, firstSpace);
  const ratingText = message.slice(firstSpace + 1).trim();

  let messageRating;
  Object.keys(ratings).forEach((rating) => {
    // does the ratingText contain any emoji
    if (!messageRating && ratings[rating].find(emoji => ratingText.indexOf(emoji) >= 0)) {
      messageRating = rating;
    }
  });

  console.log('Rating for >', keyword, '< >', messageRating, '<');

  return {
    shortcode: keyword,
    rating: messageRating
  };
}
exports.main = global.main = main;
