"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import AssistWalkerOutlinedIcon from "@mui/icons-material/AssistWalkerOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { modules } from "@/config/modules";

const drawerWidth = 272;

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack spacing={1.5} sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: "common.white",
              border: "1px solid",
              borderColor: "divider",
              height: 42,
              width: 42
            }}
          >
            <Image src="/favicon-bola.png" alt="Meu futebol" width={34} height={34} priority />
          </Avatar>
          <Box>
            <Typography fontWeight={900}>Meu Futebol</Typography>
            <Typography color="text.secondary" variant="caption">
              Liga de futebol
            </Typography>
          </Box>
        </Stack>
      </Stack>
      <Divider />
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        <ListItemButton
          LinkComponent={Link}
          href="/dashboard"
          selected={pathname === "/" || pathname === "/dashboard"}
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemIcon>
            <DashboardOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <ListItemButton
              LinkComponent={Link}
              href={item.href}
              key={item.href}
              selected={pathname === item.href}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon>
                <Icon />
              </ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: "background.default", display: "flex", minHeight: "100vh" }}>
      <AppBar
        color="inherit"
        elevation={0}
        position="fixed"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          ml: { md: `${drawerWidth}px` },
          width: { md: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            aria-label="Abrir menu"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: "none" } }}
          >
            <MenuOutlinedIcon />
          </IconButton>
          <AssistWalkerOutlinedIcon color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={800}>Painel do campeonato</Typography>
            <Typography color="text.secondary" variant="caption">
              Temporada 2025/2026
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: "secondary.main" }}>E</Avatar>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ flexShrink: { md: 0 }, width: { md: drawerWidth } }}>
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
          }}
          variant="temporary"
        >
          {drawer}
        </Drawer>
        <Drawer
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
          }}
          variant="permanent"
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          maxWidth: "100%",
          p: { xs: 2, sm: 3 },
          pt: { xs: 10, sm: 11 }
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
