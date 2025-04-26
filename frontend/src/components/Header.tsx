// src/components/Header.tsx
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
import { Link } from "react-router-dom";
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

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: "black" }} elevation={0}>
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setDrawerOpen(true)}>
              <MenuIcon sx={{ color: "#fff" }} />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, color: "#fff" }}>
            <Link to="/mainpage" style={{ textDecoration: "none" }}>
              TrackIt
            </Link>
          </Typography>
          {!isMobile &&
            navItems.map((item) => (
              <Button
                key={item.label}
                startIcon={item.icon}
                sx={{ color: "#fff", textTransform: "none", mx: 0.5 }}
                href={item.path}
              >
                {item.label}
              </Button>
            ))}
          {/* spacer */}
          <Box sx={{ flexGrow: 1 }} />
          <SearchBar />
          <IconButton
            component={Link}
            to="/search"
            sx={{ color: "#fff", ml: 1 }}
            title="Advanced filters"
          >
            <FilterListIcon />
          </IconButton>
          <UserMenu />
          <IconButton sx={{ color: "#fff" }}>
            <BookmarkIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <List>
            {navItems.map((item) => (
              <ListItemButton key={item.label} component="a" href={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {/* also include in mobile drawer */}
            <ListItemButton component={Link} to="/search">
              <ListItemIcon sx={{ color: "#000" }}>
                <FilterListIcon />
              </ListItemIcon>
              <ListItemText primary="Advanced Search" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
