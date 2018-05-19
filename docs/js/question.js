const questionTemplate = Handlebars.compile($('#question-template').html());

var currentQuestion;

function showQuestion(questionId) {
  console.log('Retrieving question with id', questionId);
  emoting.read(questionId).done(function(question) {
    console.log('[OK]', question);
    currentQuestion = question;

    const context = {};
    context.ratingChoices = ratingChoices.keys;
    context.question = question;

    $('#empty-layout-body').html(questionTemplate(context));
    $('.rating').on('click', handleRating);

    $('#section-loading').fadeOut().hide();
    $('#empty-layout').fadeIn().css('display', 'flex');
  }).fail(function(error) {
    console.log('[KO]', error);
  });
}

function handleRating(event) {
  const rating = $(event.target);
  const value = rating.attr('data-value');
  const shake = rating.attr('data-shake');
  console.log('tap on', value);

  rating.addClass(`shake-constant ${shake}`);

  emoting.rate(currentQuestion.id, value).done(function(result) {
    console.log('[OK] Rated!', result);
  }).error(function(error) {
    console.log('[KO]', error);
  });

  // animate no matter what
  setTimeout(function() {
    rating.removeClass(`shake-constant ${shake}`);
  }, 500);
}
