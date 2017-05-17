const homeTemplate = Handlebars.compile($('#home-template').html());

function showHome() {
  $('#section-loading').hide();
  $('#default-layout-body').html(homeTemplate());
  $('#default-layout').css('display', 'flex');
}

// fill the question field with a sample text
function setSampleQuestion(title) {
  $('#title').val(title);
}

// create new question
$(document).on('submit', '#questionCreate', (e) => {
  e.preventDefault();

  const questionTitle = $('#title').val();
  console.log('Submitting question', questionTitle);

  emoting.create(questionTitle).done((result) => {
    console.log('[OK] Redirecting to', result.id, result.admin_uuid);
    window.location.hash = `#/${result.id}/${result.admin_uuid}`;
  }).fail((error) => {
    console.log('[KO]', error);
  });
});
