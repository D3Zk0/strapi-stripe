'use strict';

module.exports = {
  async createProduct(ctx) {
    try {
      const {
        title,
        price,
        imageId,
        imageUrl,
        description,
        isSubscription,
        paymentInterval,
        trialPeriodDays,
      } = ctx.request.body;
      const stripeProductResponse = await strapi
        .plugin('strapi-stripe')
        .service('stripeService')
        .createProduct(
          title,
          price,
          imageId,
          imageUrl,
          description,
          isSubscription,
          paymentInterval,
          trialPeriodDays
        );
      ctx.send(stripeProductResponse, 200);
    } catch (error) {
      return {
        status: 500,
        message: error.message,
      };
    }
  },
  async find(ctx) {
    const { offset, limit, sort, order } = ctx.params;
    let needToshort;
    if (sort === 'name') {
      needToshort = { title: `${order}` };
    } else if (sort === 'price') {
      needToshort = { price: `${order}` };
    }
    const count = await strapi.query('plugin::strapi-stripe.ss-product').count();

    const res = await strapi.query('plugin::strapi-stripe.ss-product').findMany({
      orderBy: needToshort,
      offset,
      limit,
      populate: true,
    });

    ctx.body = { res, count };
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const res = await strapi
      .query('plugin::strapi-stripe.ss-product')
      .findOne({ where: { id }, populate: true });
    ctx.body = res;
  },
  async updateProduct(ctx) {
    const { id } = ctx.params;
    const { title, url, description, productImage, stripeProductId } = ctx.request.body;
    const updateProductResponse = await strapi
      .plugin('strapi-stripe')
      .service('stripeService')
      .updateProduct(id, title, url, description, productImage, stripeProductId);
    ctx.send(updateProductResponse, 200);
  },

  async createCheckoutSession(ctx) {
    const {
      stripePriceId,
      stripePlanId,
      isSubscription,
      productId,
      productName,
      userEmail,
      userId,
    } = ctx.request.body;

    const checkoutSessionResponse = await strapi
      .plugin('strapi-stripe')
      .service('stripeService')
      .createCheckoutSession(
        stripePriceId,
        stripePlanId,
        isSubscription,
        productId,
        productName,
        userEmail,
        userId
      );
    ctx.send(checkoutSessionResponse, 200);
  },
  async retrieveCheckoutSession(ctx) {
    const { id } = ctx.params;
    const retrieveCheckoutSessionResponse = await strapi
      .plugin('strapi-stripe')
      .service('stripeService')
      .retrieveCheckoutSession(id);

    ctx.send(retrieveCheckoutSessionResponse, 200);
  },
  async savePayment(ctx) {
    const {
      txnDate,
      transactionId,
      isTxnSuccessful,
      txnMessage,
      txnAmount,
      customerName,
      customerEmail,
      stripeProduct,
    } = ctx.request.body;

    const savePaymentDetails = await strapi.query('plugin::strapi-stripe.ss-payment').create({
      data: {
        txnDate,
        transactionId,
        isTxnSuccessful,
        txnMessage: JSON.stringify(txnMessage),
        txnAmount,
        customerName,
        customerEmail,
        stripeProduct,
      },
      populate: true,
    });
    await strapi.plugin('strapi-stripe').service('stripeService').sendDataToCallbackUrl(txnMessage);
    return savePaymentDetails;
  },
  async getProductPayments(ctx) {
    const { id, sort, order, offset, limit } = ctx.params;
    let needToshort;
    if (sort === 'name') {
      needToshort = { customerName: `${order}` };
    } else if (sort === 'email') {
      needToshort = { customerEmail: `${order}` };
    } else if (sort === 'date') {
      needToshort = { txnDate: `${order}` };
    }
    const count = await strapi.query('plugin::strapi-stripe.ss-payment').count({
      where: { stripeProduct: id },
    });

    const payments = await strapi.query('plugin::strapi-stripe.ss-payment').findMany({
      where: { stripeProduct: id },
      orderBy: needToshort,
      offset,
      limit,
      populate: true,
    });
    return { payments, count };
  },
  async searchSubscriptionStatus(ctx) {
    const { email } = ctx.params;

    const subscriptionStatus = await strapi
      .plugin('strapi-stripe')
      .service('stripeService')
      .searchSubscriptionStatus(email);

    if (subscriptionStatus) {
      ctx.send(subscriptionStatus, 200);
    } else {
      ctx.send(subscriptionStatus, 204);
    }
  },
};
