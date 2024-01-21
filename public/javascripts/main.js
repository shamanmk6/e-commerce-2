(function ($) {
  "use strict";

  // Dropdown on mouse hover
  $(document).ready(function () {
    function toggleNavbarMethod() {
        console.log("toggleNavbarMethod executed");
        if ($(window).width() > 992) {
            console.log("Larger than 992 pixels");
            $(".navbar .dropdown")
                .off("mouseover mouseout") // Remove previous event handlers
                .on("mouseover", function () {
                    console.log("Mouseover");
                    $(this).addClass("show");
                })
                .on("mouseout", function () {
                    console.log("Mouseout");
                    $(this).removeClass("show");
                });
        } else {
            console.log("Smaller than or equal to 992 pixels");
            $(".navbar .dropdown").removeClass("show"); // Hide the dropdown for smaller screens
        }
    }

    toggleNavbarMethod();
    $(window).resize(toggleNavbarMethod);
});



  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Vendor carousel
  $(".vendor-carousel").owlCarousel({
    loop: true,
    margin: 29,
    nav: false,
    autoplay: true,
    smartSpeed: 1000,
    responsive: {
      0: {
        items: 2,
      },
      576: {
        items: 3,
      },
      768: {
        items: 4,
      },
      992: {
        items: 5,
      },
      1200: {
        items: 6,
      },
    },
  });

  // Related carousel
  $(".related-carousel").owlCarousel({
    loop: true,
    margin: 29,
    nav: false,
    autoplay: true,
    smartSpeed: 1000,
    responsive: {
      0: {
        items: 1,
      },
      576: {
        items: 2,
      },
      768: {
        items: 3,
      },
      992: {
        items: 4,
      },
    },
  });

  // Product Quantity
  $(".quantity button").on("click", function () {
    var button = $(this);
    var oldValue = button.parent().parent().find("input").val();
    if (button.hasClass("btn-plus")) {
      var newVal = parseFloat(oldValue) + 1;
    } else {
      if (oldValue > 0) {
        var newVal = parseFloat(oldValue) - 1;
      } else {
        newVal = 0;
      }
    }
    button.parent().parent().find("input").val(newVal);
  });
});

function addToCart(proId) {
  console.log("addToCart function called");
  $.ajax({
    url: "/add-to-cart/" + proId,
    method: "get",
    success: (response) => {
      console.log("AJAX Success Callback", response);
      if (response.status) {
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);
      } else {
        // If the user is not logged in, redirect to the login page

        if (typeof response === "string" && response.includes("<html")) {
          console.log("Redirecting to login page");
          window.location.href = "/login";
        } else {
          // Handle other cases or log the unexpected response
          console.error("Unexpected response:", response);
        }
      }
    },
    error: (error) => {
      console.error("Error adding to cart:", error);
      // Handle error, if needed
    },
  });
}
  function changeQuantity(cartId, proId, userId, count) {
    let quantity = parseInt(document.getElementById(proId).value);
    count = parseInt(count);
    $.ajax({
      url: "/change-product-quantity",
      data: {
        user: userId,
        cart: cartId,
        product: proId,
        count: count,
        quantity: quantity,
      },
      method: "post",
      success: (response, status, xhr) => {
        if (xhr.status === 200) {
          console.log("Server Response:", response);
          if (response.removedProduct) {
            location.reload();
          } else {
            document.getElementById(proId).value = quantity + count;
            document.getElementById("total").innerHTML = response.total;
          }
        } else {
          console.error("Unexpected status code:", xhr.status);
        }
      },

      error: (xhr, status, error) => {
        console.error("AJAX Error:", error);
      },
    });
  }

jQuery;
