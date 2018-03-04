var $ = require('jquery')
require('popper')
require('bootstrap')
require('hammer')

$(document).ready(function(){
  // Prevent the dragging of images
  $('img').on('dragstart', function(event) { event.preventDefault(); });

  // Swipe support
  var carousel = document.querySelector('#slideshow');
  var hammer = new Hammer(carousel);
  hammer.on("swiperight", function() {
    $(carousel).carousel('prev');
  });
  hammer.on("swipeleft", function() {
    $(carousel).carousel('next');
  });

  // Keyboard navigation
  $(document).keydown(function(e) {
    if (e.keyCode === 37) {
      $(".carousel-control-prev").click();
      return false;
    }
    if (e.keyCode === 39) {
      $(".carousel-control-next").click();
      return false;
    }
  });

  // Calculate slides
  var totalItems = $('.carousel-item').length;
  var currentIndex = $('div.active').index() + 1;
  $('.slide-count').html('<p>'+currentIndex+' of '+totalItems+'</p>');

  // Bind to slide event
  $('#slideshow').on('slid.bs.carousel', function() {
    currentIndex = $('div.active').index() + 1;
    $('.slide-count').html('<p>'+currentIndex+' of '+totalItems+'</p>');
    $('.carousel-control-prev, .carousel-control-next').show();
  });
});
