import prisma from "../config/prisma";

export class UserAddressService {
  public async getAddresses(userId: number) {
    return prisma.userAddress.findMany({
      where: { user_id: userId },
      orderBy: { is_default: 'desc' }
    });
  }

  public async addAddress(userId: number, phone: string, address: string) {
    // Check if this is the first address, if so, make it default
    const count = await prisma.userAddress.count({ where: { user_id: userId } });
    const isDefault = count === 0;

    return prisma.userAddress.create({
      data: {
        user_id: userId,
        phone,
        address,
        is_default: isDefault
      }
    });
  }

  public async setDefaultAddress(userId: number, addressId: number) {
    const address = await prisma.userAddress.findFirst({
      where: { address_id: addressId, user_id: userId }
    });

    if (!address) {
      throw new Error("Không tìm thấy địa chỉ");
    }

    // Set all to false
    await prisma.userAddress.updateMany({
      where: { user_id: userId },
      data: { is_default: false }
    });

    // Set target to true
    return prisma.userAddress.update({
      where: { address_id: addressId },
      data: { is_default: true }
    });
  }

  public async deleteAddress(userId: number, addressId: number) {
    const address = await prisma.userAddress.findFirst({
      where: { address_id: addressId, user_id: userId }
    });

    if (!address) {
      throw new Error("Không tìm thấy địa chỉ");
    }

    await prisma.userAddress.delete({
      where: { address_id: addressId }
    });

    // If it was default, set another one as default
    if (address.is_default) {
      const first = await prisma.userAddress.findFirst({
        where: { user_id: userId }
      });
      if (first) {
        await prisma.userAddress.update({
          where: { address_id: first.address_id },
          data: { is_default: true }
        });
      }
    }

    return { message: "Đã xóa địa chỉ" };
  }
}
