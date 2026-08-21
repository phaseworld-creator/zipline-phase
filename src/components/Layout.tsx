import type { Response } from "@/lib/api/response";
import useAvatar from "@/lib/client/hooks/useAvatar";
import useLogin from "@/lib/client/hooks/useLogin";
import { useLogout } from "@/lib/client/hooks/useLogout";
import { useUserStore } from "@/lib/client/store/user";
import type { SafeConfig } from "@/lib/config/safe";
import { fetchApi } from "@/lib/fetchApi";
import { isAdministrator } from "@/lib/role";
import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Divider,
  Menu,
  NavLink,
  Paper,
  ScrollArea,
  Title,
} from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useModals } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";
import {
  IconAdjustments,
  IconChevronDown,
  IconChevronRight,
  IconClipboardCopy,
  IconExternalLink,
  IconFileText,
  IconFileUpload,
  IconFiles,
  IconFolder,
  IconGraph,
  IconHome,
  IconLink,
  IconLogout,
  IconRefreshDot,
  IconSettingsFilled,
  IconShieldLockFilled,
  IconStopwatch,
  IconTags,
  IconUpload,
  IconUsersGroup,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import {
  Link,
  NavigateFunction,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from "react-router-dom";
import type { dashboardLoader } from "../client/routes";
import ConfigProvider from "./ConfigProvider";
import VersionBadge from "./VersionBadge";
import { SETTINGS_EXTERNAL_LINKS } from "./pages/serverSettings";

type NavLinks = {
  label: string;
  icon: React.ReactNode;
  active: (path: string) => boolean;
  href?: string;
  links?: NavLinks[];
  if?: (user: Response["/api/user"]["user"], config: SafeConfig) => boolean;
};

const navLinks: NavLinks[] = [
  {
    label: "Home",
    icon: <IconHome size="1rem" />,
    active: (path: string) => path === "/dashboard",
    href: "/dashboard",
  },
  {
    label: "Metrics",
    icon: <IconGraph size="1rem" />,
    active: (path: string) => path === "/dashboard/metrics",
    href: "/dashboard/metrics",
    if: (user, config) =>
      config.features.metrics.enabled &&
      (config.features.metrics.adminOnly ? isAdministrator(user?.role) : true),
  },
  {
    label: "Files",
    icon: <IconFiles size="1rem" />,
    active: (path: string) => path === "/dashboard/files",
    href: "/dashboard/files",
  },
  {
    label: "Folders",
    icon: <IconFolder size="1rem" />,
    active: (path: string) => path === "/dashboard/folders",
    href: "/dashboard/folders",
  },
  {
    label: "Upload",
    icon: <IconUpload size="1rem" />,
    active: (path: string) => path.startsWith("/dashboard/upload"),
    links: [
      {
        label: "File",
        icon: <IconFileUpload size="1rem" />,
        active: (path: string) => path === "/dashboard/upload/file",
        href: "/dashboard/upload/file",
      },
      {
        label: "Text",
        icon: <IconFileText size="1rem" />,
        active: (path: string) => path === "/dashboard/upload/text",
        href: "/dashboard/upload/text",
      },
    ],
  },
  {
    label: "URLs",
    icon: <IconLink size="1rem" />,
    active: (path: string) => path === "/dashboard/urls",
    href: "/dashboard/urls",
  },
  {
    label: "Administrator",
    icon: <IconShieldLockFilled size="1rem" />,
    if: (user) => isAdministrator(user?.role),
    active: (path: string) => path.startsWith("/dashboard/admin"),
    links: [
      {
        label: "Dashboard",
        icon: <IconHome size="1rem" />,
        active: (path: string) => path === "/dashboard/admin",
        href: "/dashboard/admin",
      },
      {
        label: "Settings",
        icon: <IconAdjustments size="1rem" />,
        active: (path: string) => path.startsWith("/dashboard/admin/settings"),
        if: (user) => user?.role === "SUPERADMIN",
        href: "/dashboard/admin/settings",
        links: SETTINGS_EXTERNAL_LINKS.map(({ label, href, icon: Icon }) => ({
          label,
          icon: <Icon size="1rem" />,
          active: (path: string) => path === href,
          href,
        })),
      },
      {
        label: "Actions",
        icon: <IconStopwatch size="1rem" />,
        active: (path: string) => path === "/dashboard/admin/actions",
        href: "/dashboard/admin/actions",
      },
      {
        label: "Users",
        icon: <IconUsersGroup size="1rem" />,
        active: (path: string) => path === "/dashboard/admin/users",
        href: "/dashboard/admin/users",
      },
      {
        label: "Invites",
        icon: <IconTags size="1rem" />,
        active: (path: string) => path === "/dashboard/admin/invites",
        href: "/dashboard/admin/invites",
        if: (_, config) => config.invites.enabled,
      },
    ],
  },
];

const renderLinks = (
  links: NavLinks[],
  pathname: string,
  user: Response["/api/user"]["user"],
  config: SafeConfig,
  navigate: NavigateFunction,
) => {
  const visible = (link: NavLinks) => !link.if || link.if(user, config);

  const active = (link: NavLinks): boolean => {
    if (!visible(link)) return false;
    if (link.active(pathname)) return true;

    return (link.links || []).some((child) => active(child));
  };

  return links.map((link) => {
    if (visible(link)) {
      const sublinks = link.links;
      const isActive = link.active(pathname);

      if (!sublinks) {
        return (
          <NavLink
            key={link.label}
            label={link.label}
            leftSection={link.icon}
            variant="light"
            rightSection={<IconChevronRight size="0.7rem" />}
            active={isActive}
            component={Link}
            to={link.href || ""}
          />
        );
      } else {
        return (
          <NavLink
            key={link.label}
            label={link.label}
            leftSection={link.icon}
            variant="light"
            rightSection={<IconChevronRight size="0.7rem" />}
            active={isActive && !sublinks.some((child) => active(child))}
            defaultOpened={isActive || sublinks.some((child) => active(child))}
            onClick={(event) => {
              if (!link.href) return;
              event.preventDefault();
              navigate(link.href);
            }}
          >
            {renderLinks(sublinks, pathname, user, config, navigate)}
          </NavLink>
        );
      }
    }
    return null;
  });
};

export default function Layout() {
  const [opened, setOpened] = useState(false);
  const modals = useModals();
  const clipboard = useClipboard();
  const setUser = useUserStore((s) => s.setUser);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();

  const loaderData = useLoaderData<typeof dashboardLoader>() as {
    config: SafeConfig;
    [key: string]: any;
  };
  const config = loaderData.config;

  const { user, mutate } = useLogin();
  const { avatar } = useAvatar();

  // Close mobile drawer seamlessly on path change
  useEffect(() => {
    setOpened(false);
  }, [location.pathname]);

  const copyToken = () => {
    modals.openConfirmModal({
      title: "Copy token?",
      children:
        "Are you sure you want to copy your token? Your token can interact with all parts of Zipline. Do not share this token with anyone.",
      labels: { confirm: "Copy", cancel: "No, close this popup" },
      onConfirm: async () => {
        const { data, error } =
          await fetchApi<Response["/api/user/token"]>("/api/user/token");
        if (error) {
          showNotification({
            title: "Error",
            message: error.error,
            color: "red",
            icon: <IconClipboardCopy size="1rem" />,
          });
        } else {
          clipboard.copy(data?.token ?? "");
          showNotification({
            title: "Copied",
            message: "Your token has been copied to your clipboard.",
            color: "green",
            icon: <IconClipboardCopy size="1rem" />,
          });
        }
      },
    });
  };

  const refreshToken = () => {
    modals.openConfirmModal({
      title: "Refresh token?",
      children:
        "Are you sure you want to refresh your token? Once you refresh/reset your token, you will need to update any scripts or applications that use your token.",
      labels: { confirm: "Refresh", cancel: "No, close this popup" },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response["/api/user/token"]>(
          "/api/user/token",
          "PATCH",
        );
        if (error) {
          showNotification({
            title: "Error",
            message: error.error,
            color: "red",
            icon: <IconRefreshDot size="1rem" />,
          });
        } else {
          setUser(data?.user);
          mutate(data as Response["/api/user"]);

          showNotification({
            title: "Refreshed",
            message: "Your token has been refreshed.",
            color: "green",
            icon: <IconRefreshDot size="1rem" />,
          });
        }
      },
    });
  };

  const logoMark = (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: "linear-gradient(135deg, #6366f1, #f43f5e)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: 16,
        color: "#fff",
        flexShrink: 0,
        boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
      }}
    >
      {config.website.titleLogo ? (
        <Avatar
          src={config.website.titleLogo}
          alt="Zipline logo"
          radius="sm"
          size={28}
        />
      ) : (
        (config.website.title?.trim()[0] ?? "Z").toUpperCase()
      )}
    </div>
  );

  return (
    <AppShell
      navbar={{
        breakpoint: "sm",
        width: { sm: 210, lg: 240 },
        collapsed: { mobile: !opened },
      }}
      header={{ height: 64 }}
      footer={{ height: 0.1 }}
      styles={{
        main: {
          background: "var(--bg, #030712)",
          minHeight: "100vh",
        },
      }}
    >
      {/* ── Header ── */}
      <AppShell.Header
        px="md"
        style={{
          background: "rgba(3, 7, 18, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <Burger
            opened={opened}
            onClick={() => setOpened((o) => !o)}
            size="sm"
            color="#94a3b8"
            mr="md"
            hiddenFrom="sm"
            style={{ borderRadius: "var(--mantine-radius-md)" }}
          />

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoMark}
            <Title
              visibleFrom="sm"
              lineClamp={1}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "-0.02em",
                color: "var(--text-main, #f8fafc)",
              }}
            >
              {config.website.title.trim()}
            </Title>
          </div>

          {/* Right side: user menu */}
          <div style={{ marginLeft: "auto" }}>
            <Menu shadow="md" width={220} offset={10}>
              <Menu.Target>
                <Button
                  variant="subtle"
                  color="gray"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "var(--radius-inner, 16px)",
                    color: "var(--text-main, #f8fafc)",
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    padding: "6px 14px",
                  }}
                  leftSection={
                    avatar ? (
                      <Avatar
                        src={avatar}
                        radius="xl"
                        size={24}
                        alt={user?.username ?? "User avatar"}
                      />
                    ) : (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #6366f1, #f43f5e)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        {(user?.username?.[0] ?? "U").toUpperCase()}
                      </div>
                    )
                  }
                  rightSection={<IconChevronDown size="0.7rem" />}
                  size="sm"
                >
                  {user?.username}
                </Button>
              </Menu.Target>

              <Menu.Dropdown
                style={{
                  background: "rgba(3, 7, 18, 0.92)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                }}
              >
                <Menu.Label
                  style={{
                    color: "var(--text-faint, #475569)",
                    fontSize: "0.75rem",
                  }}
                >
                  {user?.username}
                  {isAdministrator(user?.role) ? " · Administrator" : ""}
                </Menu.Label>

                <Menu.Item
                  leftSection={<IconClipboardCopy size="1rem" />}
                  onClick={copyToken}
                  style={{ color: "var(--text-muted, #94a3b8)" }}
                >
                  Copy token
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconRefreshDot size="1rem" />}
                  onClick={refreshToken}
                >
                  Refresh token
                </Menu.Item>
                <Menu.Divider
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                />

                <Menu.Item
                  leftSection={<IconSettingsFilled size="1rem" />}
                  component={Link}
                  to="/dashboard/settings"
                  style={{ color: "var(--text-muted, #94a3b8)" }}
                >
                  Settings
                </Menu.Item>

                {user?.role === "SUPERADMIN" && (
                  <Menu.Item
                    leftSection={<IconAdjustments size="1rem" />}
                    component={Link}
                    to="/dashboard/admin/settings"
                    style={{ color: "var(--text-muted, #94a3b8)" }}
                  >
                    Server Settings
                  </Menu.Item>
                )}

                <Menu.Divider
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size="1rem" />}
                  onClick={logout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </div>
      </AppShell.Header>

      {/* ── Navbar ── */}
      <AppShell.Navbar
        zIndex={90}
        style={{
          background: "rgba(3, 7, 18, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mobile title */}
        <Box
          hiddenFrom="sm"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 16px 12px",
          }}
        >
          {logoMark}
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1rem",
              color: "var(--text-main, #f8fafc)",
              letterSpacing: "-0.02em",
            }}
          >
            {config.website.title.trim()}
          </span>
        </Box>
        <Divider
          hiddenFrom="sm"
          style={{ borderColor: "rgba(255,255,255,0.08)", marginBottom: 8 }}
        />

        {/* Nav links */}
        <ScrollArea style={{ flex: 1 }} px={8} py={4}>
          {renderLinks(navLinks, location.pathname, user, config, navigate)}
        </ScrollArea>

        {/* Bottom section */}
        <div style={{ padding: "8px 0" }}>
          <VersionBadge />
          <Divider
            style={{ borderColor: "rgba(255,255,255,0.08)", margin: "8px 0" }}
          />
          <ScrollArea mah={160} px={8}>
            <Box>
              {config.website.externalLinks.map(({ name, url }, i) => (
                <NavLink
                  key={i}
                  label={name}
                  leftSection={<IconExternalLink size="1rem" />}
                  variant="light"
                  component={Link}
                  to={url}
                  target="_blank"
                  style={{ borderRadius: 10, marginBottom: 2 }}
                />
              ))}
            </Box>
          </ScrollArea>
        </div>
      </AppShell.Navbar>

      {/* ── Main content ── */}
      <AppShell.Main>
        <ConfigProvider data={loaderData}>
          <Paper
            withBorder
            m="md"
            p="md"
            radius="xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Outlet />
          </Paper>
        </ConfigProvider>
      </AppShell.Main>

      <AppShell.Footer display="none" />
    </AppShell>
  );
}
