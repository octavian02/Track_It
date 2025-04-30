import React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  BookmarkBorder as BookmarkIcon,
  Movie as MovieIcon,
  Tv as TvIcon,
  People as PeopleIcon,
  EmojiEvents as AwardsIcon,
  Chat as CommunityIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import UserMenu from "./UserMenu";
import SearchBar from "./SearchBar";

const navItems = [
  { label: "Tracking", icon: <PeopleIcon />, path: "/track" },
  { label: "Movies", icon: <MovieIcon />, path: "/movies" },
  { label: "TV Shows", icon: <TvIcon />, path: "/tv" },
  { label: "Awards", icon: <AwardsIcon />, path: "/awards" },
  { label: "Community", icon: <CommunityIcon />, path: "/community" },
];

const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const toggleDrawer = (open: boolean) => () => setDrawerOpen(open);

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "#000" }} elevation={1}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={toggleDrawer(true)}
              sx={{ color: "#fff" }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Brand */}
          <Typography
            component={RouterLink}
            to="/mainpage"
            variant="h5"
            sx={{
              color: "#fff",
              fontWeight: 700,
              textDecoration: "none",
              "&:hover": { color: "primary.main" },
              mr: 2,
            }}
          >
            TrackIt
          </Typography>

          {/* Desktop Nav Items */}
          {!isMobile && (
            <Box
              sx={{ display: "flex", flexGrow: 1, justifyContent: "center" }}
            >
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: "#fff",
                    textTransform: "none",
                    mx: 0.5,
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Search & Actions */}
          <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
            <SearchBar />
            <IconButton
              component={RouterLink}
              to="/search"
              sx={{ color: "#fff", ml: 1 }}
              title="Advanced filters"
            >
              <FilterListIcon />
            </IconButton>
            <UserMenu />
            <IconButton
              component={RouterLink}
              to="/watchlist"
              sx={{ color: "#fff", ml: 1 }}
              title="My Watchlist"
            >
              <BookmarkIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
        >
          <List>
            {navItems.map((item) => (
              <ListItemButton
                key={item.label}
                component={RouterLink}
                to={item.path}
                sx={{ color: "#000" }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            <ListItemButton component={RouterLink} to="/search">
              <ListItemIcon>
                <FilterListIcon />
              </ListItemIcon>
              <ListItemText primary="Advanced Search" />
            </ListItemButton>
            <ListItemButton component={RouterLink} to="/watchlist">
              <ListItemIcon>
                <BookmarkIcon />
              </ListItemIcon>
              <ListItemText primary="Watchlist" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
