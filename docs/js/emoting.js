const apiUrl = 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/dafa1c64d9f09d875b0e53d96f1c6d888a51199b461db7540baab47dce602d1a/emoting/1';
const ratingChoices = ['verygood', 'good', 'bad', 'verybad'];
const emoting = {
  create(questionTitle) {
    return $.ajax({
      type: 'PUT',
      url: `${apiUrl}/questions`,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify({ title64: window.btoa(encodeURIComponent(questionTitle)) }),
      dataType: 'json',
    });
  },
  read(questionId) {
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      url: `${apiUrl}/questions?id=${questionId}`
    });
  },
  rate(questionId, ratingValue) {
    return $.ajax({
      type: 'PUT',
      url: `${apiUrl}/ratings?questionId=${questionId}&rating=${ratingValue}`
    });
  },
  stats(questionId, adminUuid) {
    return $.ajax({
      type: 'GET',
      url: `${apiUrl}/stats?id=${questionId}&admin=${adminUuid}`,
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    });
  }
};

(function() {
  $(document).ready(function() {
    console.log('emoting started');
    handleHash();
  });

  $(window).on('hashchange', () => {
    handleHash();
  });

  function handleHash() {
    $('#section-loading').fadeIn().css('display', 'flex');
    $('#default-layout').hide();
    $('#empty-layout').hide();

    const hash = window.location.hash;
    console.log('Hash is >', hash, '<');
    if (hash) {
      const params = hash.substring(2).split('/');
      console.log('Params are', params);

      if (params.length === 2) {
        showAdmin(params[0], params[1]);
      } else if (params.length === 1) {
        showQuestion(params[0]);
      } else {
        showHome();
      }
    } else {
      showHome();
    }
  }
})();
