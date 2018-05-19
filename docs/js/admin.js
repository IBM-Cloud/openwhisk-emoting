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
    result.hasResults = result.total > 0;

    // render the admin page
    $('#default-layout-body').html(adminTemplate(result));

    // show the admin page
    $('#section-loading').fadeOut().hide();
    $('#default-layout').fadeIn().css('display', 'flex');

    if (result.total === 0) {
      return;
    }

    var ctx = document.getElementById("chart-doughnut").getContext('2d');
    var doughnut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: Object.keys(ratingChoices).map(function(key) { return result.ratings[key].value; }),
          backgroundColor: Object.keys(ratingChoices).map(function(key) { return ratingChoices[key].color; })
        }],
        labels: Object.keys(ratingChoices)
      },
      options: {
        rotation: -1 * Math.PI,
        animation: {
          animateScale: true,
          animateRotation: true
        }
      }
    });

    // to test
    Chart.defaults.global.animation.duration = 3000;

    ctx = document.getElementById("stats-chart").getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: Object.keys(ratingChoices).map(function(key) {
          return {
            fill: false,
            label: key,
            cubicInterpolationMode: 'monotone',
            borderDash: key.indexOf('very') >= 0 ? [] : [5, 5],
            borderColor: ratingChoices[key].color,
            data: result.minute[key].map(function(item) {
              return {
                x: new Date(item.date),
                y: item.count
              };
            })
          };
        })
      },
      options: {
        scales: {
          xAxes: [{
            type: 'time',
            display: true,
            ticks: {
              major: {
                fontStyle: 'bold',
                fontColor: '#FF0000'
              }
            }
          }],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'count'
            }
          }]
        }
      }
    });
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
