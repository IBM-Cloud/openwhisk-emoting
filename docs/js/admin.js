const adminTemplate = Handlebars.compile($('#admin-template').html());

// handles clicks on the <Copy> button
new Clipboard('.copyToClipboard');

function showAdmin(questionId, adminUuid) {
  console.log('Retrieving admin page with id', questionId, 'and admin', adminUuid);
  emoting.stats(questionId, adminUuid).done((result) => {
    console.log('[OK]', result);

    result.url = `${window.location.origin}${window.location.pathname}#/${result.question.id}`;

    // render the admin page
    $('#default-layout-body').html(adminTemplate(result));

    // show the admin page
    $('#section-loading').fadeOut().hide();
    $('#default-layout').fadeIn().css('display', 'flex');
  }).fail((error) => {
    console.log('[KO]', error);
  });
}
