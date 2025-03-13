import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message, Row, Col, Card, Upload, Modal, Checkbox, Switch } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';

const { TextArea } = Input;
const { Option } = Select;

const ProductForm = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [imageList, setImageList] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [priceDetails, setPriceDetails] = useState([]);
  const [inStock, setInStock] = useState(0);
  const [available, setAvailable] = useState(true);
  const [isCakeProduct, setIsCakeProduct] = useState(false);
  const [isVeg, setIsVeg] = useState(true);
  const [isPastry, setIsPastry] = useState(false);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api10.theblackforestcakes.com:5000';

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token'); // ✅ Add token
      const response = await fetch(`${BACKEND_URL}/api/categories/list-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }, // ✅ Include Authorization header
      });
      const data = await response.json();
      console.log('Categories Fetch Response:', data); // ✅ Debug log
      if (response.ok) {
        setCategories(Array.isArray(data) ? data : []); // ✅ Ensure array
      } else {
        message.error('Failed to fetch categories');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Error fetching categories');
      setCategories([]);
    }
  };

  const fetchAlbums = async () => {
    try {
      const token = localStorage.getItem('token'); // ✅ Add token for consistency
      const response = await fetch(`${BACKEND_URL}/api/albums`, {
        headers: { 'Authorization': `Bearer ${token}` }, // ✅ Add token if required
      });
      const data = await response.json();
      console.log('Albums Fetch Response:', data); // ✅ Debug log
      if (response.ok) {
        setAlbums(Array.isArray(data) ? data : []);
      } else {
        message.error('Failed to fetch albums');
        setAlbums([]);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      message.error('Error fetching albums');
      setAlbums([]);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAlbums();
  }, []);

  const handlePriceChange = (index, field, value) => {
    const updatedDetails = [...priceDetails];
    if (field === 'price' || field === 'rate' || field === 'offerPercent' || field === 'quantity') {
      const numericValue = value.replace(/[^0-9]/g, '');
      updatedDetails[index] = { ...updatedDetails[index], [field]: numericValue };
    } else {
      updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    }
    setPriceDetails(updatedDetails);
  };

  const onFinish = async (values) => {
    console.log('🚀 Submitting Product:', values);

    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('category', values.category);
    if (isCakeProduct && values.album) {
      formData.append('album', values.album);
    }
    formData.append('description', values.description || '');
    formData.append('foodNotes', values.foodNotes || '');
    formData.append('ingredients', values.ingredients || '');
    formData.append('inStock', inStock);
    formData.append('available', available);
    formData.append('isVeg', isVeg);
    formData.append('isPastry', isPastry);
    formData.append('isCakeProduct', isCakeProduct);

    imageList.forEach((file) => {
      formData.append('images', file.originFileObj || file);
    });

    formData.append('priceDetails', JSON.stringify(priceDetails));

    try {
      const response = await fetch(`${BACKEND_URL}/api/products`, {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      console.log('📥 Server Response:', responseData);

      if (response.ok) {
        message.success('✅ Product created successfully!');
        form.resetFields();
        setPriceDetails([]);
        setImageList([]);
        setInStock(0);
        setAvailable(true);
        setIsCakeProduct(false);
        setIsVeg(true);
        setIsPastry(false);
        router.push('/products/List');
      } else {
        message.error(`❌ Error: ${responseData.message || 'Failed to create product'}`);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      message.error('❌ Unable to reach the server.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '15px' }}>
        <h2 style={{ margin: 0 }}>Create Product</h2>
        <Row align="middle">
          <Checkbox
            checked={isCakeProduct}
            onChange={(e) => setIsCakeProduct(e.target.checked)}
            style={{ marginRight: '8px' }}
          >
            Enable Cake Product
          </Checkbox>
          <Checkbox
            checked={isPastry}
            onChange={(e) => setIsPastry(e.target.checked)}
            style={{ marginRight: '20px' }}
          >
            Pastry
          </Checkbox>
          <Switch
            checked={isVeg}
            onChange={(checked) => setIsVeg(checked)}
            checkedChildren="Veg"
            unCheckedChildren="Non-Veg"
            style={{ backgroundColor: isVeg ? '#52c41a' : '#ff4d4f' }}
          />
        </Row>
      </Row>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Product Name"
          name="name"
          rules={[{ required: true, message: 'Please enter product name!' }]}
          style={{ marginBottom: '8px' }}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true, message: 'Please select a category!' }]}
              style={{ marginBottom: '8px' }}
            >
              <Select placeholder="Select Category">
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map(category => (
                    <Option key={category._id} value={category._id}>{category.name}</Option>
                  ))
                ) : (
                  <Option disabled>No categories available</Option>
                )}
              </Select>
            </Form.Item>
          </Col>
          {isCakeProduct && (
            <Col span={12}>
              <Form.Item
                label="Album"
                name="album"
                rules={[{ required: true, message: 'Please select an album!' }]}
                style={{ marginBottom: '8px' }}
              >
                <Select placeholder="Select Album">
                  {Array.isArray(albums) && albums.length > 0 ? (
                    albums.map(album => (
                      <Option key={album._id} value={album._id}>{album.name}</Option>
                    ))
                  ) : (
                    <Option disabled>No albums available</Option>
                  )}
                </Select>
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item label="Description" name="description">
          <TextArea placeholder="Description of product" rows={2} />
        </Form.Item>

        <Form.Item label="Food Notes" name="foodNotes">
          <TextArea placeholder="Footnote of product" rows={2} />
        </Form.Item>

        <Form.Item label="Ingredients" name="ingredients">
          <Input placeholder="Enter ingredients (comma-separated)" />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="In Stock">
              <Input
                type="number"
                placeholder="Enter stock quantity"
                value={inStock}
                onChange={(e) => setInStock(Number(e.target.value))}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Available">
              <Checkbox checked={available} onChange={(e) => setAvailable(e.target.checked)}>
                Product is Available
              </Checkbox>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Product Images">
          <Upload
            listType="picture-card"
            beforeUpload={(file) => {
              setImageList([...imageList, file]);
              return false;
            }}
            onPreview={async (file) => {
              let previewUrl = file.originFileObj ? URL.createObjectURL(file.originFileObj) : file.url || file.preview;
              setPreviewImage(previewUrl);
              setPreviewVisible(true);
            }}
            onRemove={(file) => {
              setImageList(imageList.filter((item) => item !== file));
            }}
          >
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Form.Item>

        <Button
          type="dashed"
          onClick={() =>
            setPriceDetails([
              ...priceDetails,
              { price: '', rate: '', offerPercent: '', quantity: '', unit: '', gst: 0, cakeType: '' }
            ])
          }
          style={{ marginBottom: '8px' }}
        >
          Add Price Details
        </Button>
        {priceDetails.map((detail, index) => (
          <Card key={index} style={{ marginBottom: '8px' }}>
            <Row gutter={8}>
              <Col span={4}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Price (MRP)</div>
                <Input
                  placeholder="Price (MRP)"
                  value={detail.price}
                  onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                  type="text"
                />
              </Col>
              <Col span={4}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Rate</div>
                <Input
                  placeholder="Rate"
                  value={detail.rate}
                  onChange={(e) => handlePriceChange(index, 'rate', e.target.value)}
                  type="text"
                />
              </Col>
              <Col span={3}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Offer %</div>
                <Input
                  placeholder="Offer %"
                  value={detail.offerPercent}
                  onChange={(e) => handlePriceChange(index, 'offerPercent', e.target.value)}
                  type="text"
                />
              </Col>
              <Col span={3}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Quantity</div>
                <Input
                  placeholder="Quantity"
                  value={detail.quantity}
                  onChange={(e) => handlePriceChange(index, 'quantity', e.target.value)}
                  type="text"
                />
              </Col>
              <Col span={3}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Unit</div>
                <Select
                  placeholder="Unit"
                  value={detail.unit}
                  onChange={(value) => handlePriceChange(index, 'unit', value)}
                  style={{ width: '100%' }}
                >
                  <Select.Option value="kg">Kg</Select.Option>
                  <Select.Option value="g">Gram</Select.Option>
                  <Select.Option value="pcs">Pieces</Select.Option>
                </Select>
              </Col>
              <Col span={3}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>GST</div>
                <Select
                  placeholder="GST"
                  value={detail.gst}
                  onChange={(value) => handlePriceChange(index, 'gst', value)}
                  style={{ width: '100%' }}
                >
                  <Select.Option value={0}>0%</Select.Option>
                  <Select.Option value={5}>5%</Select.Option>
                  <Select.Option value={12}>12%</Select.Option>
                  <Select.Option value={18}>18%</Select.Option>
                  <Select.Option value={22}>22%</Select.Option>
                </Select>
              </Col>
              {isCakeProduct && (
                <Col span={3}>
                  <div style={{ marginBottom: '4px', fontSize: '12px' }}>Cake Type</div>
                  <Select
                    placeholder="Cake Type"
                    value={detail.cakeType}
                    onChange={(value) => handlePriceChange(index, 'cakeType', value)}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="freshCream">FC</Select.Option>
                    <Select.Option value="butterCream">BC</Select.Option>
                  </Select>
                </Col>
              )}
              <Col span={isCakeProduct ? 1 : 4}>
                <div style={{ marginBottom: '4px', fontSize: '12px' }}>Delete</div>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const updatedDetails = priceDetails.filter((_, i) => i !== index);
                    setPriceDetails(updatedDetails);
                  }}
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
          </Card>
        ))}

        <Form.Item>
          <Button type="primary" htmlType="submit">Create</Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ProductForm;