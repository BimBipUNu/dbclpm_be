import prisma from "../config/prisma";

export class DashboardService {
  public async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue this month
    const revenueThisMonth = await prisma.order.aggregate({
      where: {
        order_status: { not: "Cancelled" },
        order_date: { gte: startOfMonth },
      },
      _sum: { total_amount: true },
    });

    // Revenue last month
    const revenueLastMonth = await prisma.order.aggregate({
      where: {
        order_status: { not: "Cancelled" },
        order_date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { total_amount: true },
    });

    // Total orders this month
    const ordersThisMonth = await prisma.order.count({
      where: { order_date: { gte: startOfMonth } },
    });

    // Total orders last month
    const ordersLastMonth = await prisma.order.count({
      where: { order_date: { gte: startOfLastMonth, lte: endOfLastMonth } },
    });

    // Active users
    const totalUsers = await prisma.user.count({
      where: { status: "Active", role: "Customer" },
    });

    // Low stock products (variants with stock < 10)
    const lowStockProducts = await prisma.productVariant.count({
      where: { stock_quantity: { lt: 10 } },
    });

    // Pending orders
    const pendingOrders = await prisma.order.count({
      where: { order_status: "Pending" },
    });

    // Revenue trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await prisma.order.findMany({
      where: {
        order_status: { not: "Cancelled" },
        order_date: { gte: sevenDaysAgo },
      },
      select: { order_date: true, total_amount: true },
    });

    // Group by day
    const dailyRevenue: { date: string; revenue: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sevenDaysAgo);
      day.setDate(day.getDate() + i);
      const dayStr = day.toISOString().split("T")[0] as string;
      const dayOrders = recentOrders.filter(o => {
        const d = new Date(o.order_date!);
        return (d.toISOString().split("T")[0] as string) === dayStr;
      });
      dailyRevenue.push({
        date: dayStr,
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
      });
    }

    // Recent 5 orders
    const recentOrdersList = await prisma.order.findMany({
      take: 5,
      orderBy: { order_date: "desc" },
      include: {
        user: { select: { full_name: true } },
      },
    });

    const currentRevenue = Number(revenueThisMonth._sum.total_amount || 0);
    const lastRevenue = Number(revenueLastMonth._sum.total_amount || 0);
    const revenueTrend = lastRevenue > 0 ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100) : 0;
    const ordersTrend = ordersLastMonth > 0 ? Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100) : 0;

    return {
      kpis: {
        revenue: { value: currentRevenue, trend: revenueTrend },
        orders: { value: ordersThisMonth, trend: ordersTrend },
        activeUsers: totalUsers,
        lowStockProducts,
        pendingOrders,
      },
      dailyRevenue,
      recentOrders: recentOrdersList,
    };
  }
}
