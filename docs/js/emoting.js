const apiUrl = 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api/478d2549e52d97fcf5121e94214965b9f9461d1688901278ed591ef32ddeb2ff/emoting/1';
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
  },
  setShortcode(questionId, adminUuid, shortcode) {
    return $.ajax({
      type: 'POST',
      url: `${apiUrl}/questions/shortcode`,
      data: {
        id: questionId,
        admin: adminUuid,
        shortcode },
      dataType: 'json',
    });
  }
};

(function() {
  $(document).ready(function() {
    console.log('emoting started');
    handleHash();
  });

  $(window).on('hashchange', function() {
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

  document.addEventListener('DOMContentLoaded', function () {
    // Get all "navbar-burger" elements
    var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  
    // Check if there are any navbar burgers
    if ($navbarBurgers.length > 0) {
  
      // Add a click event on each of them
      $navbarBurgers.forEach(function ($el) {
        $el.addEventListener('click', function () {
  
          // Get the target from the "data-target" attribute
          var target = $el.dataset.target;
          var $target = document.getElementById(target);
  
          // Toggle the class on both the "navbar-burger" and the "navbar-menu"
          $el.classList.toggle('is-active');
          $target.classList.toggle('is-active');
  
        });
      });
    }
  });
})();
