import React, { useEffect, useState, useCallback, useContext } from 'react';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import Searchbar from '../../components/spots/Searchbar';
import FreeSwitch from '../../components/spots/Switch_Spots';
import SpotCard from '../../components/spots/SpotCard';
import SpotDetail from '../../components/spots/SpotDetail';
import { LEFT_WIDTH, NAVBAR_HEIGHT } from '../../utils/constants';
import './spots.css';
import Sort_Spots from '../../components/spots/Sort_Spots';
import FilterCheckbox from '../../components/spots/FilterCheckbox_Spots';
import SpotCard_PopUp from '../../components/spots/SpotsCard_PopUp';
import List from '../../components/list/List';
import Btn_List from '../../components/list/Btn_List';
import { ListContext } from '../../contexts/ListContext';
import Btn_Close_Left from '../../components/Btn_Close_Left';
import AlertModal from '../../components/AlertModal';
import Map_Spots from '../../components/spots/Map_Spots';
import SkeletonSpotCard from '../../components/spots/SkeletonSpotCard';

import { useUpdateLeftWidth, useUpdateNavbarHeight } from '../../utils/useResponsiveSizes';

const Spots: React.FC<{ selectedDates: [moment.Moment | null, moment.Moment | null] | null }> = ({ selectedDates }) => {
  const [activeSpot, setActiveSpot] = useState(null);
  const [spots, setSpots] = useState([]);
  const [isFree, setIsFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayedSpots, setDisplayedSpots] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortOption, setSortOption] = useState('user_ratings_total');
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [popupSpot, setPopupSpot] = useState(null);
  const [hoveredSpot, setHoveredSpot] = useState(null);
  const { showList, toggleList, closeList, isLeftPanelVisible, toggleLeftPanel, selectedDates: contextSelectedDates } = useContext(ListContext);
  const batchSize = 10;

  const [alertOpen, setAlertOpen] = useState(false);

  const handleExpand = useCallback((spot) => {
    console.log("expand active spot:", spot);
    setActiveSpot(spot);
  }, []);

  const handleCollapse = useCallback(() => {
    setActiveSpot(null);
  }, []);

  const fetchSpots = useCallback(() => {
    setLoading(true);
    let url;
    if (contextSelectedDates && contextSelectedDates[0] && contextSelectedDates[1]) {
      const startDate = contextSelectedDates[0].format('YYYY-MM-DD');
      const endDate = contextSelectedDates[1].format('YYYY-MM-DD');

      url = `/api/attractions/filter_within_date?startDate=${startDate}&endDate=${endDate}&sortBy=${sortOption}`;
 
    }

    else {
      url = `/api/attractions/filter?sortBy=${sortOption}`;


    }

    if (isFree) {
      url += '&isFree=true';
    }
    if (categories.length > 0) {
      url += `&categories=${categories.join(',')}`;
    }
    if (searchTerm) {
      url += `&name=${searchTerm}`;
    }

    fetch(url)
      .then(response => response.json())
      .then(data => {

        console.log("Fetched attractions data:", data);

        if (Array.isArray(data)) {
          setSpots(data);
          setDisplayedSpots(data.slice(0, batchSize));  // ←✅ 只有 data 是数组才调用 slice
          setCurrentIndex(batchSize);
        } else {
          console.error("❗后端返回的 spots 不是数组：", data);
          setSpots([]);
          setDisplayedSpots([]);
        }

      })
      .catch(error => {
        console.error('Error fetching attractions data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sortOption, isFree, categories, searchTerm, contextSelectedDates]);

  useEffect(() => {
    fetchSpots();
  }, [sortOption, isFree, categories, searchTerm, contextSelectedDates, fetchSpots]);

  const handleSwitchChange = useCallback(() => {
    setIsFree(!isFree);
  }, [isFree]);

  const loadMoreSpots = useCallback(() => {
    if (loading) return;
    setLoading(true);
    const nextIndex = currentIndex + batchSize;
    const newDisplayedSpots = spots.slice(0, nextIndex);
    setDisplayedSpots(newDisplayedSpots);
    setCurrentIndex(nextIndex);
    setLoading(false);
  }, [currentIndex, spots, loading]);

  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      loadMoreSpots();
    }
  }, [loadMoreSpots]);

  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  const handleCategoryChange = (selectedCategories) => {
    setCategories(selectedCategories);
  };

  const handleSearch = (searchText) => {
    setSearchTerm(searchText);
  };

  const handleMarkerClick = useCallback((spot) => {
    console.log("spots.tsx marker clicked", spot);
    setPopupSpot(spot);
  }, []);

  const handlePopupClose = () => {
    setPopupSpot(null);
  };

  useEffect(() => {
    if (popupSpot) {
      console.log("data of popupSpot", popupSpot);
      console.log("data of popupSpot index", popupSpot.index);
    }
  }, [popupSpot]);

  const handleMissingDates = () => {
    setAlertOpen(true);
  };

  useUpdateLeftWidth();
  useUpdateNavbarHeight();

  return (
    <div style={{ display: 'flex' }}>
      {isLeftPanelVisible && (
        <div
          style={{
            width: LEFT_WIDTH,
            padding: '18px 1.2vw 0px 1.2vw',
            marginTop: NAVBAR_HEIGHT,
            height: `calc(100vh - ${NAVBAR_HEIGHT})`,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'hidden'
          }}
        >

          {/* ---------------   search bar & filter & sort   ----------------------------- */}
          {!activeSpot && (
            <>
              <Stack direction="row" justifyContent="center">
                <Searchbar onSearch={handleSearch} />
              </Stack>

              <Stack direction="row" sx={{ paddingX: 1, paddingTop: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                <FilterCheckbox onChange={handleCategoryChange} />
                <FreeSwitch checked={isFree} onChange={handleSwitchChange} />
                <Sort_Spots value={sortOption} onChange={handleSortChange} />
              </Stack>
             

           {/* ---------------   number count   ----------------------------- */}

              {loading ? (
                
  <Skeleton variant="text" width="80px" height="60px" animation="wave" style={{ marginLeft: 12, marginTop: 10 }} />
) : (
  spots.length > 0 && <h2 style={{ marginLeft: 10, marginTop: 10 }}>{spots.length} spots</h2>
)}

          {/* ---------------   empty image   ----------------------------- */}

            { spots.length === 0 && !loading && (
            <>
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      marginTop: '-180px',
    }}
  >
    <img 
      src="images/empty.png" 
      alt="Empty list" 
      style={{ width: '50%' }} 
    />
    <Typography 
      variant="body2" 
      sx={{
        color: '#999', 
        fontSize: '1em', 
        marginTop: '8px', 
        textAlign: 'center'
      }}
    >
      Sorry, no result here.
    </Typography>

  </Box>
</>
) }
              
            </>
          )}

          <div className="spot-card-container hide-scrollbar" style={{ flexGrow: 1, overflowY: 'auto' }} onScroll={handleScroll}>
            {activeSpot ? (
              <SpotDetail spot={activeSpot} onCollapse={handleCollapse} />
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1.5, paddingX: '12px' }}>
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonSpotCard key={index} />
                ))
              ) : (
                displayedSpots.map((spot) => (
                  <SpotCard
                    key={spot.id}
                    id={spot.index}
                    image1={`/images/spots_small/${spot.index}_1.webp`}
                    image3={`/images/spots_small/${spot.index}_3.webp`}
                    title={spot.attraction_name}
                    rating={spot.attraction_rating}
                    price={spot.price}
                    isFree={spot.free}
                    category={spot.category}
                    user_ratings_total={spot.user_ratings_total}
                    onExpand={() => handleExpand(spot)}
                    onHover={() => setHoveredSpot(spot)}
                    onLeave={() => setHoveredSpot(null)}
                  />
                ))
              )}
            </Box>
            
            )}
          </div>

         
        </div>
      )}

      <div className="map hide-scrollbar" style={{ position: 'fixed', top: NAVBAR_HEIGHT, right: 0, width: isLeftPanelVisible ? `calc(100% - ${LEFT_WIDTH})` : '100%', height: `calc(100vh - ${NAVBAR_HEIGHT})`, overflowY: 'auto' }}>



        <Map_Spots events={spots} onMarkerClick={handleMarkerClick} activeSpot={activeSpot} popupSpot={popupSpot} onPopupClose={handlePopupClose} hoveredSpot={hoveredSpot} />

     {/* ---------------   popup card on map ----------------------------- */}


        {popupSpot && (
          <SpotCard_PopUp
            key={popupSpot.index}
            id={popupSpot.index}
            image1={`/images/spots_small/${popupSpot.index}_1.webp`}
            image3={`/images/spots_small/${popupSpot.index}_3.webp`}
            title={popupSpot.attraction_name}
            rating={popupSpot.attraction_rating}
            category={popupSpot.category}
            isFree={popupSpot.free}
            user_ratings_total={popupSpot.user_ratings_total}
            onClose={handlePopupClose}
          />
        )}
      </div>


   {/* ---------------   3 buttons ----------------------------- */}

      <Btn_List onClick={toggleList} />



      {showList && <List onClose={closeList} selectedDates={contextSelectedDates} />}

      <Btn_Close_Left onClick={toggleLeftPanel} />



 {/* ---------------   alert modal ----------------------------- */}

      {alertOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
           	alignItems: 'center',
            zIndex: 1300
          }}
          onClick={() => setAlertOpen(false)}
        >
          <AlertModal
            open={alertOpen}
            onClose={() => setAlertOpen(false)}
            title="Warning"
            message="Please set the start and end dates before adding items to the list."
          />
        </Box>
        
      )}



    </div>
  );
};

export default Spots;
