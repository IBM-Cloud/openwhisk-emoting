const adminTemplate = Handlebars.compile($('#admin-template').html());

// handles clicks on the <Copy> button
new Clipboard('.copyToClipboard');

var currentQuestion;

function showAdmin(questionId, adminUuid) {
  console.log('Retrieving admin page with id', questionId, 'and admin', adminUuid);
  emoting.stats(questionId, adminUuid).done(function(result) {
    console.log('[OK]', result);

    currentQuestion = result;
    currentQuestion.admin_uuid = adminUuid;

    result.url = `${window.location.origin}${window.location.pathname}#/${result.question.id}`;

    // render the admin page
    $('#default-layout-body').html(adminTemplate(result));

    // show the admin page
    $('#section-loading').fadeOut().hide();
    $('#default-layout').fadeIn().css('display', 'flex');
  }).fail(function(error) {
    console.log('[KO]', error);
  });

  // set shortcode
  $(document).on('submit', '#questionShortcode', function(e) {
    e.preventDefault();

    const shortcode = $('#shortcode').val();
    console.log('Set shortcode', shortcode, 'to', currentQuestion.question.id, 'admin', currentQuestion.admin_uuid);

    $('#applyShortcode').addClass('is-loading');

    emoting.setShortcode(currentQuestion.question.id, currentQuestion.admin_uuid, shortcode).done(function(result) {
      console.log('[OK] Shortcode set!', result);
      $('#applyShortcode').removeClass('is-loading');
    }).fail(function(error) {
      $('#applyShortcode').removeClass('is-loading');
      console.log('[KO]', error);
    });
  });
}
