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
  InputBase,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  AccountCircle as AccountCircleIcon,
  BookmarkBorder as BookmarkIcon,
  Movie as MovieIcon,
  Tv as TvIcon,
  People as PeopleIcon,
  EmojiEvents as AwardsIcon,
  Chat as CommunityIcon,
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { Link } from "react-router-dom";
import UserMenu from "./UserMenu";

const navItems = [
  { label: "Movies", icon: <MovieIcon />, path: "/movies" },
  { label: "TV Shows", icon: <TvIcon />, path: "/tv" },
  { label: "Celebs", icon: <PeopleIcon />, path: "/celebs" },
  { label: "Awards", icon: <AwardsIcon />, path: "/awards" },
  { label: "Community", icon: <CommunityIcon />, path: "/community" },
];

const SearchWrapper = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.25) },
  marginLeft: theme.spacing(1),
  width: "auto",
}));

const StyledInput = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1),
    transition: theme.transitions.create("width"),
    width: 0,
    "&:focus": { width: "12ch" },
  },
}));

const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

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

          {/* search toggle */}
          {searchOpen ? (
            <SearchWrapper>
              <SearchIcon
                sx={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              />
              <StyledInput
                placeholder="Search…"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
            </SearchWrapper>
          ) : (
            <IconButton
              onClick={() => setSearchOpen(true)}
              sx={{ color: "#fff" }}
            >
              <SearchIcon />
            </IconButton>
          )}

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
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
