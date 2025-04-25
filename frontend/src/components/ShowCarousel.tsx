import React from "react";
import Slider from "react-slick";
import "./MovieCarousel.css"; // re-use your carousel styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ShowCard from "./ShowCard"; // your ShowCard component

interface Show {
  id: number;
  name: string;
  poster_path: string;
  vote_average: number;
}

interface ShowCarouselProps {
  title: string;
  shows: Show[];
}

const ShowCarousel: React.FC<ShowCarouselProps> = ({ title, shows }) => {
  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 5,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 4, slidesToScroll: 4 } },
      { breakpoint: 768, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 480, settings: { slidesToShow: 2, slidesToScroll: 2 } },
    ],
  };

  return (
    <div className="carousel-container">
      <h2 className="carousel-heading">{title}</h2>
      <Slider {...settings}>
        {shows.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))}
      </Slider>
    </div>
  );
};

export default ShowCarousel;
